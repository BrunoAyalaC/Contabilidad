import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

// Mock the auth API
jest.mock('../api/auth', () => ({
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  getMe: jest.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should provide initial authentication state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
  });

  it('should handle successful login', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    });
    (authApi.getMe as jest.Mock).mockResolvedValue({
      id: '123', username: 'testuser'
    });

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  await act(async () => { await result.current.loginUser('testuser', 'password'); });

    expect(authApi.login).toHaveBeenCalledWith('testuser', 'password');
    expect(authApi.getMe).toHaveBeenCalledWith('mock_access_token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: '123', username: 'testuser' });
    expect(result.current.accessToken).toBe('mock_access_token');
    expect(result.current.refreshToken).toBe('mock_refresh_token');
    expect(localStorage.getItem('accessToken')).toBe('mock_access_token');
    expect(localStorage.getItem('refreshToken')).toBe('mock_refresh_token');
  });

  it('should handle logout', async () => {
    // Simulate a logged-in state
    localStorage.setItem('accessToken', 'mock_access_token');
    localStorage.setItem('refreshToken', 'mock_refresh_token');
    (authApi.logout as jest.Mock).mockResolvedValue({});

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  await act(async () => { await result.current.logoutUser(); });

    expect(authApi.logout).toHaveBeenCalledWith('mock_refresh_token');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('should refresh access token', async () => {
    // Simulate a state with refresh token
    localStorage.setItem('accessToken', 'initial_access_token'); // Add initial access token
    localStorage.setItem('refreshToken', 'old_refresh_token');
    (authApi.refresh as jest.Mock).mockResolvedValue({
      accessToken: 'new_access_token',
    });
    (authApi.getMe as jest.Mock).mockResolvedValue({
      id: '123', username: 'testuser'
    });

  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

  // Initial render will try to fetch user data, which will fail without access token
  // and then try to refresh. So we need to wait for the initial effect to run.
  await waitFor(() => expect(authApi.getMe).toHaveBeenCalledTimes(1)); // Wait for initial getMe call

  await act(async () => { await result.current.refreshAccessToken(); });

    expect(authApi.refresh).toHaveBeenCalledWith('old_refresh_token');
    expect(result.current.accessToken).toBe('new_access_token');
    expect(localStorage.getItem('accessToken')).toBe('new_access_token');
  });
});
