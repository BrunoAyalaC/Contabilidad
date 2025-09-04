import React, { useState, useEffect } from 'react';
import Modal from './ui/Card';
import Button from './ui/Button';
import { uploadInvoiceForOcr, importInvoice } from '../src/api/ocr';
import { useAuth } from '../src/context/AuthContext';

// Define the expected structure of the response from OcrService
interface OcrResponse {
  // accept both casing variants from backend
  ParsedData?: {
    Ruc?: string;
    InvoiceDate?: string; // Or Date type if you parse it
    TotalAmount?: number;
    ConfidenceScores?: { [key: string]: number };
  } | null;
  parsedData?: {
    ruc?: string;
    invoiceDate?: string;
    totalAmount?: number;
    confidence?: number | { [key: string]: number };
  } | null;
  RawText?: string;
  rawText?: string;
  message?: string; // For error messages from backend
}

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsed: any) => void; // parsed data from OCR
}

const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose, onApply }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null); // Use OcrResponse type
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setStatus(null);
      setOcrResult(null); // Reset full OCR result
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Seleccione un PDF primero.');
      return;
    }
    if (!accessToken) {
      setError('Inicie sesión para subir archivos.');
      return;
    }

    setLoading(true);
    setError(null);
    setOcrResult(null); // Clear previous result
    setStatus('Processing'); // Indicate processing started

    try {
      const response: OcrResponse = await uploadInvoiceForOcr(file, accessToken!);
      setOcrResult(response);
      setStatus('Completed'); // Status is immediately completed for direct response
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      setStatus('Failed'); // Set status to failed on error
      setOcrResult(null); // Clear result on error
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Normalize parsed data from either parsedData or ParsedData
    const parsed = ocrResult ? (ocrResult.parsedData ?? ocrResult.ParsedData ?? null) : null;
    if (parsed) {
  try { console.debug('OcrModal.handleApply -> parsed normalized:', parsed); } catch {}
  onApply(parsed);
      onClose();
    }
  };

  const handleSendToAccounting = async () => {
    // Recompute normalized values locally to be explicit and use Extras as fallback
    const parsed = ocrResult ? (ocrResult.parsedData ?? ocrResult.ParsedData ?? null) : null;
    const raw = ocrResult ? (ocrResult.rawText ?? ocrResult.RawText ?? '') : '';
    const extras = (ocrResult as any)?.Extras ?? (ocrResult as any)?.extras ?? null;

    if (!parsed && !extras) {
      setError('No hay datos OCR para enviar.');
      return;
    }
    if (!accessToken) {
      setError('Inicie sesión para enviar a contabilidad.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build minimal import payload; normalize keys from parsed and extras
      const documentNumber = (parsed as any)?.invoiceNumber || (parsed as any)?.InvoiceNumber || extras?.invoiceNumber || extras?.InvoiceNumber;
      const ruc = (parsed as any)?.ruc || (parsed as any)?.Ruc || extras?.issuerRuc || extras?.issuer_ruc || extras?.issuerRUC;
      const totalRaw = (parsed as any)?.totalAmount || (parsed as any)?.TotalAmount || extras?.total || extras?.TotalAmount;
      const taxRaw = (parsed as any)?.igv || (parsed as any)?.igvAmount || extras?.igv || extras?.taxAmount;

      // Ensure numeric total/tax
      const TotalAmount = totalRaw ? Number(totalRaw) : undefined;
      const TaxAmount = taxRaw ? Number(taxRaw) : undefined;

      const payload: any = {
        CorrelationId: (parsed as any)?.correlationId || (parsed as any)?.CorrelationId || extras?.correlationId || undefined,
        DocumentType: 'FACTURA',
        DocumentNumber: documentNumber,
        Date: (parsed as any)?.invoiceDate || (parsed as any)?.InvoiceDate || (parsed as any)?.date || undefined,
        Ruc: ruc,
        PartyName: (parsed as any)?.partyName || (parsed as any)?.PartyName || extras?.partyName || extras?.PartyName || undefined,
        TotalAmount: TotalAmount,
        TaxAmount: TaxAmount,
        Currency: (parsed as any)?.currency || (parsed as any)?.Currency || extras?.currency || 'PEN',
        InvoiceType: 'Purchase',
        OcrData: { raw, parsed, extras }
      };

      // Client-side validation to avoid server 400s
      const missing: string[] = [];
      if (!payload.Ruc) missing.push('Ruc');
      if (!payload.DocumentNumber) missing.push('DocumentNumber');
      if (!payload.TotalAmount || Number.isNaN(payload.TotalAmount) || payload.TotalAmount <= 0) missing.push('TotalAmount');

      if (missing.length > 0) {
        setError(`Faltan campos obligatorios: ${missing.join(', ')}. Revise los datos extraídos o aplique manualmente antes de enviar.`);
        setLoading(false);
        return;
      }

  // Log payload for debugging in dev
  try { console.debug('OcrModal.handleSendToAccounting -> Import payload', payload); } catch {}

      const resp = await importInvoice(payload, accessToken!);
      // axios returns full response; server returns 202 for queued or 200 for success
      if (resp.status === 202) {
        setStatus('Queued');
        setOcrResult(prev => ({ ...prev, message: 'Import queued for retry by server.' } as any));
      } else {
        setStatus('Imported');
        setOcrResult(prev => ({ ...prev, message: 'Imported to Accounting.' } as any));
      }

  try { console.debug('OcrModal.handleSendToAccounting -> Import response', resp); } catch {}
    } catch (err: any) {
      const code = err.response?.status;
      if (code === 202) {
        setStatus('Queued');
      } else if (code === 400) {
        // Show server returned details when available
        const msg = err.response?.data?.message || JSON.stringify(err.response?.data) || 'Solicitud inválida (400)';
        setError(`Error 400 del servidor: ${msg}`);
      } else {
        const msg = err.response?.data?.message || err.message || 'Error al enviar a contabilidad';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // normalized values for rendering
  const normalizedParsed = ocrResult ? (ocrResult.parsedData ?? ocrResult.ParsedData ?? null) : null;
  const normalizedRaw = ocrResult ? (ocrResult.rawText ?? ocrResult.RawText ?? '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg w-[900px] max-w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Subir PDF para OCR</h3>
          <button className="text-gray-500" onClick={onClose}>Cerrar</button>
        </div>

        <div className="space-y-4">
          <input type="file" accept="application/pdf" onChange={handleFile} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setFile(null); setOcrResult(null); setStatus(null); setError(null); }}>Limpiar</Button>
            <Button variant="primary" onClick={handleUpload} disabled={!file || loading}>{loading ? 'Subiendo...' : 'Subir y Procesar'}</Button>
          </div>

          {status && <div>
            <div><strong>Status:</strong> {status}</div>
          </div>}

          {error && <div className="text-red-600">{error}</div>}

          {ocrResult && (
            <div className="mt-4 max-h-[400px] overflow-auto border p-3 rounded">
              <h4 className="font-medium mb-2">Datos extraídos</h4>
              {normalizedParsed ? (
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(normalizedParsed, null, 2)}</pre>
              ) : (
                <p>No se encontraron datos estructurados.</p>
              )}
              <h4 className="font-medium mb-2 mt-4">Texto crudo</h4>
              <pre className="text-sm whitespace-pre-wrap">{normalizedRaw}</pre>
              <div className="flex justify-end mt-3">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSendToAccounting} disabled={!normalizedParsed || loading}>{loading ? 'Enviando...' : 'Enviar a Contabilidad'}</Button>
                  <Button variant="primary" onClick={handleApply}>Aplicar datos al formulario</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrModal;
