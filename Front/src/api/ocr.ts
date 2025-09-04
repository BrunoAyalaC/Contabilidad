import axios from 'axios';

// In development we use a relative path so Vite can proxy '/api/Ocr' to the backend and avoid CORS issues.
const API_URL = '/api/Ocr';

export const uploadInvoiceForOcr = async (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/invoices`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const importInvoice = async (payload: any, accessToken: string) => {
  try {
    const response = await axios.post(`/api/Import/invoices/import`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response;
  } catch (error: any) {
    // Rethrow full error to allow caller to inspect status and data
    throw error;
  }
};


