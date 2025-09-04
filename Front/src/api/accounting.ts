import axios from 'axios';

// Use relative path so Vite dev server can proxy to the Accounting backend (avoids CORS)
const API_URL = '/api/Accounting';

export const getPcgeAccounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/accounts`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const registerInvoice = async (invoiceData: any) => {
  try {
    const response = await axios.post(`${API_URL}/register-invoice`, invoiceData);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getJournalEntries = async () => {
  try {
    const response = await axios.get(`${API_URL}/journal-entries`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
