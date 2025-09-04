import os
import sys
import json
import re
from pathlib import Path

folder = Path(r"C:\Users\Pc\Desktop\Lester\Auxiliar")
files = list(folder.glob("*.pdf"))

results = []

for f in files:
    info = {"file": str(f.name), "text_sample": None, "detected": {"ruc": False, "total": False, "date": False}, "error": None}
    try:
        text = ""
        # Try PyPDF2
        try:
            import PyPDF2
            with open(f, 'rb') as fh:
                reader = PyPDF2.PdfReader(fh)
                for p in reader.pages:
                    try:
                        t = p.extract_text() or ''
                    except Exception:
                        t = ''
                    text += t + "\n"
        except Exception:
            # Try pdfminer.six
            try:
                from pdfminer.high_level import extract_text
                text = extract_text(str(f)) or ''
            except Exception as e:
                info['error'] = f"No extractor available or failed: {e}"
        
        sample = (text or '')[:1500].strip()
        info['text_sample'] = sample
        # Heuristics
        if re.search(r"R\.?U\.?C\.?[:\s]*[0-9]{8,11}|\bRUC[:\s]*[0-9]{8,11}", text, re.I):
            info['detected']['ruc'] = True
        if re.search(r"TOTAL|IMPORTE TOTAL|TOTAL A PAGAR|IMPORTE:|\b[0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{1,2})\b", text, re.I):
            info['detected']['total'] = True
        if re.search(r"\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b", text):
            info['detected']['date'] = True
    except Exception as ex:
        info['error'] = str(ex)
    results.append(info)

# Print JSON
print(json.dumps(results, ensure_ascii=False, indent=2))
