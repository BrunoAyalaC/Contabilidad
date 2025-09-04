import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login, refresh, logout, getMe } from '../api/auth';

console.log('AuthContext: module loaded');

interface AuthContextType {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginUser: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!accessToken);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthProvider: initializeAuth start', { accessToken: !!accessToken, refreshToken: !!refreshToken });
      try {
        if (accessToken && refreshToken) {
          try {
            const userData = await getMe(accessToken);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to fetch user data with existing token:", error);
            // Try to refresh if access token is invalid
            try {
              await refreshAccessToken();
            } catch (refreshError) {
              console.error("Failed to refresh token:", refreshError);
              await logoutUser(); // Logout if refresh also fails
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } finally {
            if (isAuthLoading) { // Ensure it's set to false even if an unexpected path occurred
              setIsAuthLoading(false);
            }
            console.log('AuthProvider: initializeAuth end', { isAuthenticated: isAuthenticated });
          }
    };
    initializeAuth();
  }, []);

  const loginUser = async (username: string, password: string) => {
    const data = await login(username, password);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const userData = await getMe(data.accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  setIsAuthLoading(false);
  };

  const logoutUser = async () => {
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available.");
    }
    const data = await refresh(refreshToken);
    setAccessToken(data.accessToken);
    localStorage.setItem('accessToken', data.accessToken);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, isAuthenticated, isAuthLoading, loginUser, logoutUser, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
