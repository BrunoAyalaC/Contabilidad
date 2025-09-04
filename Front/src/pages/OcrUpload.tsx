import React, { useState } from 'react';
import { uploadInvoiceForOcr } from '../api/ocr';
import { useAuth } from '../context/AuthContext';

// Define the expected structure of the response from OcrService
interface OcrResponse {
  ParsedData: {
    Ruc?: string;
    InvoiceDate?: string; // Or Date type if you parse it
    TotalAmount?: number;
    ConfidenceScores?: { [key: string]: number };
  } | null;
  RawText: string;
  message?: string; // For error messages from backend
}

const OcrUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResponse | null>(null); // New state for the full OCR response
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { accessToken } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setOcrResult(null); // Reset full OCR result
      setStatus(null); // Reset status
      setError(null); // Reset error
    }
  };

  const handleUpload = async () => {
        if (!selectedFile) {
          setError('Please select a file first.');
          return;
        }
        if (!accessToken) {
          setError('You must be logged in to upload files.');
          return;
        }

        setLoading(true);
        setError(null);
        try {
          const response: OcrResponse = await uploadInvoiceForOcr(selectedFile, accessToken);
          // The response now directly contains ParsedData and RawText
          setOcrResult(response); // Set the entire response object
          setStatus('Completed'); // Status is immediately completed for direct response
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'File upload failed.';
          setError(errorMessage);
          setOcrResult(null); // Clear OCR result on error
          setStatus('Failed'); // Set status to failed on error
        } finally {
          setLoading(false);
        }
      };

  

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Upload Invoice for OCR</h2>
      <div style={styles.formGroup}>
        <input type="file" accept=".pdf" onChange={handleFileChange} disabled={loading} />
        <button onClick={handleUpload} disabled={!selectedFile || loading} style={styles.button}>
          {loading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {status && ( // Display status if it's set (i.e., after an upload attempt)
        <div style={styles.statusContainer}>
          <p><strong>Status:</strong> {status}</p>
          {status === 'Completed' && ocrResult && (
            <div style={styles.parsedDataContainer}>
              <h3>Parsed Data:</h3>
              {ocrResult.ParsedData ? (
                <pre style={styles.preformattedText}>{JSON.stringify(ocrResult.ParsedData, null, 2)}</pre>
              ) : (
                <p>No structured data parsed.</p>
              )}
              <h3>Raw Text:</h3>
              <pre style={styles.preformattedText}>{ocrResult.RawText}</pre>
            </div>
          )}
          {status === 'Failed' && <p>OCR processing failed. Please check the file or try again.</p>}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)', // Adjust for navbar height
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  header: {
    color: '#333',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  error: {
    color: 'red',
    marginTop: '15px',
    backgroundColor: '#ffe6e6',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid red',
  },
  statusContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  parsedDataContainer: {
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },
  preformattedText: {
    backgroundColor: '#f4f4f4',
    padding: '10px',
    borderRadius: '4px',
    overflowX: 'auto' as 'auto',
    whiteSpace: 'pre-wrap' as 'pre-wrap',
    wordBreak: 'break-all' as 'break-all',
  },
};

export default OcrUpload;
