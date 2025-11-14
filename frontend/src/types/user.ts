export type UserRole = 'owner' | 'tenant' | 'admin';

export interface User {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

