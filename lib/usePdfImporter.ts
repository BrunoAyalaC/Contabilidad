import { useState } from 'react';
import type { ParsedInvoice } from '../types';

type ImportResult = { success: true } | { success: false; message: string };

export function usePdfImporter() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(null);

  const importPdf = async (): Promise<ImportResult> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!(window as any).electronAPI || typeof (window as any).electronAPI.readPdfData !== 'function') {
        throw new Error('Electron API no disponible');
      }
      const result = await (window as any).electronAPI.readPdfData();
      if (result.success && (result.text || result.parsedData)) {
        setExtractedText(result.text || '');
        setParsedInvoice(result.parsedData || null);
        return { success: true };
      }
      const msg = result.message || 'Error desconocido al leer PDF';
      setError(msg);
      return { success: false, message: msg };
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setExtractedText('');
    setParsedInvoice(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    extractedText,
    parsedInvoice,
    importPdf,
    reset,
  } as const;
}
