import { User, LoginCredentials, AuthResponse } from '@/types/user';
import { apiClient } from './api';

// API-based authentication
export const login = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
  try {
    const response = await apiClient.login(credentials.phone, credentials.password);
    apiClient.setToken(response.token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = () => {
  apiClient.setToken(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const storeAuth = (user: User, token: string) => {
  apiClient.setToken(token);
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  }
};

