import axios from 'axios';

const API_URL = 'http://localhost:5000/api/Auth'; // Assuming AuthService runs on port 5000

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const refresh = async (refreshToken: string) => {
  try {
    const response = await axios.post(`${API_URL}/refresh`, { refreshToken });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const logout = async (refreshToken: string) => {
  try {
    const response = await axios.post(`${API_URL}/logout`, { refreshToken });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export const getMe = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
