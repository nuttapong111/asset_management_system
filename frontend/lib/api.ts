const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(phone: string, password: string) {
    return this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  async forgotPassword(phone: string) {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // Users
  async getUsers(role?: string) {
    const query = role ? `?role=${role}` : '';
    return this.request<any[]>(`/api/users${query}`);
  }

  async getUser(id: string) {
    return this.request<any>(`/api/users/${id}`);
  }

  async createUser(data: any) {
    return this.request<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Assets
  async getAssets() {
    return this.request<any[]>('/api/assets');
  }

  async getAsset(id: string) {
    return this.request<any>(`/api/assets/${id}`);
  }

  async createAsset(data: any) {
    return this.request<any>('/api/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: any) {
    return this.request<any>(`/api/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string) {
    return this.request<{ message: string }>(`/api/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Contracts
  async getContracts() {
    return this.request<any[]>('/api/contracts');
  }

  async getContract(id: string) {
    return this.request<any>(`/api/contracts/${id}`);
  }

  async createContract(data: any) {
    return this.request<any>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: any) {
    return this.request<any>(`/api/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments() {
    return this.request<any[]>('/api/payments');
  }

  async getPayment(id: string) {
    return this.request<any>(`/api/payments/${id}`);
  }

  async createPayment(data: any) {
    return this.request<any>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: any) {
    return this.request<any>(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Maintenance
  async getMaintenance() {
    return this.request<any[]>('/api/maintenance');
  }

  async getMaintenanceItem(id: string) {
    return this.request<any>(`/api/maintenance/${id}`);
  }

  async createMaintenance(data: any) {
    return this.request<any>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaintenance(id: string, data: any) {
    return this.request<any>(`/api/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/api/dashboard');
  }

  // Admin
  async getAdminSummary() {
    return this.request<any>('/api/admin/summary');
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/api/notifications');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/api/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }
}

export const apiClient = new ApiClient(API_URL);

