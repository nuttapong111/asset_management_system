import { User, LoginCredentials, AuthResponse } from '@/types/user';
import { getUserByPhone } from './mockData';

// Simple mock authentication (จะเปลี่ยนเป็น API call จริงในภายหลัง)
export const login = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
  const user = getUserByPhone(credentials.phone);
  
  if (!user || user.password !== credentials.password) {
    return null;
  }

  // Mock token
  const token = `mock_token_${user.id}_${Date.now()}`;

  return {
    user: {
      ...user,
      password: '', // ไม่ส่ง password กลับ
    },
    token,
  };
};

export const logout = () => {
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
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  }
};

