import pdfplumber
import json
import sys
import os


def extract_invoice_data_fallback(pdf_path: str):
    base = os.path.basename(pdf_path or "")
    name, _ = os.path.splitext(base)
    return {
        "InvoiceNumber": name or None,
        "InvoiceDate": None,
        "Ruc": None,
        "PartyName": None,
        "TotalAmount": 0.0,
        "TaxAmount": 0.0,
        "Currency": "PEN",
        "DocumentType": "FACTURA",
        "LineItems": [],
        "ConfidenceScores": {"Overall": 0.5},
    }


def try_import_pdfplumber():
    try:
        import pdfplumber  # type: ignore
        return pdfplumber
    except Exception:
        return None


def extract_invoice_data(pdf_path: str):
    pdfplumber = try_import_pdfplumber()
    if pdfplumber is None:
        return extract_invoice_data_fallback(pdf_path)

    import re
    data = {
        "InvoiceNumber": None,
        "InvoiceDate": None,
        "Ruc": None,
        "PartyName": None,
        "TotalAmount": None,
        "TaxAmount": None,
        "Currency": "PEN",
        "DocumentType": None,
        "LineItems": [],
        "ConfidenceScores": {},
    }
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                full_text += page.extract_text() or ""
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) > 2 and row[0] and row[1]:
                            try:
                                desc = str(row[0]).strip()
                                qty = float(row[1])
                                unit_price = float(row[2])
                                data["LineItems"].append({
                                    "Description": desc,
                                    "Quantity": qty,
                                    "UnitPrice": unit_price,
                                    "Total": qty * unit_price,
                                })
                            except (ValueError, TypeError):
                                pass

        invoice_number_match = re.search(r"[FBET][0-9]{3}-[0-9]+", full_text, re.IGNORECASE)
        if invoice_number_match:
            data["InvoiceNumber"] = invoice_number_match.group(0)

        date_match = re.search(r"\d{2}[-/]\d{2}[-/]\d{4}", full_text)
        if date_match:
            data["InvoiceDate"] = date_match.group(0)

        ruc_match = re.search(r"\b[0-9]{11}\b", full_text)
        if ruc_match:
            data["Ruc"] = ruc_match.group(0)

        total_match = re.search(r"TOTAL\s*[:]?[\s]*([0-9,.]+)", full_text, re.IGNORECASE)
        if total_match:
            try:
                data["TotalAmount"] = float(total_match.group(1).replace(",", ""))
            except Exception:
                pass

        tax_match = re.search(r"(?:IGV|IVA)\s*[:]?[\s]*([0-9,.]+)", full_text, re.IGNORECASE)
        if tax_match:
            try:
                data["TaxAmount"] = float(tax_match.group(1).replace(",", ""))
            except Exception:
                pass

        doc_type_match = re.search(r"(FACTURA|BOLETA|NOTA DE VENTA)", full_text, re.IGNORECASE)
        if doc_type_match:
            data["DocumentType"] = doc_type_match.group(1).upper()

        for key in data:
            if data[key] is not None and key not in ["LineItems", "ConfidenceScores"]:
                data["ConfidenceScores"][key] = 0.8

    except Exception as e:
        data["ErrorMessage"] = str(e)
        data["ConfidenceScores"] = {"Overall": 0.0}

    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided."}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    extracted_data = extract_invoice_data(pdf_path)
    print(json.dumps(extracted_data))
                invoice_number_match = re.search(r'[FBET][0-9]{3}-[0-9]+', full_text, re.IGNORECASE)
                if invoice_number_match:
                    data["InvoiceNumber"] = invoice_number_match.group(0)

                date_match = re.search(r'\d{2}[-/]\d{2}[-/]\d{4}', full_text)
                if date_match:
                    data["InvoiceDate"] = date_match.group(0)

                ruc_match = re.search(r'\b[0-9]{11}\b', full_text)
                if ruc_match:
                    data["Ruc"] = ruc_match.group(0)

                total_match = re.search(r'TOTAL\s*[:]?
        \s*([0-9,.]+)', full_text, re.IGNORECASE)
                if total_match:
                    try:
                        data["TotalAmount"] = float(total_match.group(1).replace(',', ''))
                    except Exception:
                        pass

                tax_match = re.search(r'IGV|IVA\s*[:]?
        \s*([0-9,.]+)', full_text, re.IGNORECASE)
                if tax_match:
                    try:
                        data["TaxAmount"] = float(tax_match.group(1).replace(',', ''))
                    except Exception:
                        pass

                doc_type_match = re.search(r'(FACTURA|BOLETA|NOTA DE VENTA)', full_text, re.IGNORECASE)
                if doc_type_match:
                    data["DocumentType"] = doc_type_match.group(1).upper()

                for key in data:
                    if data[key] is not None and key not in ["LineItems", "ConfidenceScores"]:
                        data["ConfidenceScores"][key] = 0.8

            except Exception as e:
                data["ErrorMessage"] = str(e)
                data["ConfidenceScores"] = {"Overall": 0.0}

            return data


        if __name__ == "__main__":
            if len(sys.argv) < 2:
                print(json.dumps({"error": "No PDF path provided."}))
                sys.exit(1)

            pdf_path = sys.argv[1]
            extracted_data = extract_invoice_data(pdf_path)
            print(json.dumps(extracted_data))
