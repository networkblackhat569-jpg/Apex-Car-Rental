import {
  Vehicle,
  BusinessSettings,
  HomepageSettings,
  SeoSettings,
  Enquiry,
  FAQItem,
  MediaAsset,
  AdminUser,
  DashboardMetrics,
  VehicleImage,
} from '../types';

const TOKEN_KEY = 'apex_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic fetch wrapper with error handling
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const data = await res.json();
      errMessage = data.error || data.message || errMessage;
    } catch {
      errMessage = `HTTP error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // 1. Auth & Setup
  async getSetupStatus(): Promise<{ hasAdmin: boolean }> {
    return request<{ hasAdmin: boolean }>('/api/admin/setup-status');
  },

  async setupAdmin(payload: { name: string; email: string; password: string }): Promise<{ success: boolean; token: string; user: AdminUser }> {
    const data = await request<{ success: boolean; token: string; user: AdminUser }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  async login(username: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const data = await request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAdminToken(data.token);
    return data;
  },

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<{ success: boolean; message: string; user: AdminUser }> {
    return request<{ success: boolean; message: string; user: AdminUser }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<{ user: AdminUser }> {
    return request<{ user: AdminUser }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAdminToken();
    }
  },

  async updateProfile(payload: { name: string; email: string; currentPassword?: string; newPassword?: string }): Promise<any> {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // 2. Business Settings
  async getBusinessSettings(): Promise<BusinessSettings> {
    return request<BusinessSettings>('/api/business-settings');
  },

  async updateBusinessSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    return request<BusinessSettings>('/api/business-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // 3. Homepage Settings
  async getHomepageSettings(): Promise<HomepageSettings> {
    return request<HomepageSettings>('/api/homepage-settings');
  },

  async updateHomepageSettings(settings: Partial<HomepageSettings>): Promise<HomepageSettings> {
    return request<HomepageSettings>('/api/homepage-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // 4. SEO Settings
  async getSeoSettings(): Promise<SeoSettings> {
    return request<SeoSettings>('/api/seo-settings');
  },

  async updateSeoSettings(settings: Partial<SeoSettings>): Promise<SeoSettings> {
    return request<SeoSettings>('/api/seo-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // 5. Vehicles
  async getVehicles(params: { all?: boolean; category?: string; search?: string } = {}): Promise<Vehicle[]> {
    const q = new URLSearchParams();
    if (params.all) q.append('all', 'true');
    if (params.category && params.category !== 'All') q.append('category', params.category);
    if (params.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Vehicle[]>(`/api/vehicles${qs}`);
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    return request<Vehicle>(`/api/vehicles/${id}`);
  },

  async createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
    return request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    return request<Vehicle>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteVehicle(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicateVehicle(id: string): Promise<Vehicle> {
    return request<Vehicle>(`/api/vehicles/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async toggleActive(id: string): Promise<{ isActive: boolean }> {
    return request<{ isActive: boolean }>(`/api/vehicles/${id}/toggle-active`, {
      method: 'PUT',
    });
  },

  async toggleFeatured(id: string): Promise<{ isFeatured: boolean }> {
    return request<{ isFeatured: boolean }>(`/api/vehicles/${id}/toggle-featured`, {
      method: 'PUT',
    });
  },

  async updateVehicleStatus(id: string, status: 'available' | 'booked' | 'maintenance'): Promise<any> {
    return request(`/api/vehicles/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async reorderVehicles(orderList: Array<{ id: string; displayOrder: number }>): Promise<any> {
    return request('/api/vehicles/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderList }),
    });
  },

  // 6. Vehicle Photos (Strict Relational Integrity)
  async getVehicleImages(vehicleId: string): Promise<VehicleImage[]> {
    return request<VehicleImage[]>(`/api/vehicles/${vehicleId}/images`);
  },

  async addVehicleImage(vehicleId: string, payload: { url: string; image_type?: string; label?: string; is_primary?: boolean; verified_match?: number }): Promise<VehicleImage> {
    return request<VehicleImage>(`/api/vehicles/${vehicleId}/images`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async setPrimaryImage(vehicleId: string, imageId: string): Promise<any> {
    return request(`/api/vehicles/${vehicleId}/images/${imageId}/primary`, {
      method: 'PUT',
    });
  },

  async deleteVehicleImage(vehicleId: string, imageId: string): Promise<any> {
    return request(`/api/vehicles/${vehicleId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  async reorderVehicleImages(vehicleId: string, imageOrder: Array<{ id: string; displayOrder: number }>): Promise<any> {
    return request(`/api/vehicles/${vehicleId}/images/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ imageOrder }),
    });
  },

  // 7. Media & Uploads
  async uploadFile(file: File, vehicleId?: string): Promise<{ url: string; filename: string; size: number; mediaId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (vehicleId) formData.append('vehicleId', vehicleId);

    const token = getAdminToken();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  async uploadBase64(base64Data: string, filename?: string, vehicleId?: string): Promise<{ url: string; mediaId: string }> {
    return request<{ url: string; mediaId: string }>('/api/upload-base64', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename, vehicleId }),
    });
  },

  async getMediaAssets(): Promise<MediaAsset[]> {
    return request<MediaAsset[]>('/api/media');
  },

  async deleteMediaAsset(id: string): Promise<any> {
    return request(`/api/media/${id}`, {
      method: 'DELETE',
    });
  },

  // 8. Enquiries
  async submitEnquiry(payload: {
    customerName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    vehicleId?: string;
    vehicleName: string;
    pickupDate?: string;
    returnDate?: string;
    pickupLocation?: string;
    driveOption?: 'self_drive' | 'with_driver';
    message?: string;
  }): Promise<{ id: string; message: string }> {
    return request<{ id: string; message: string }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getEnquiries(status?: string): Promise<Enquiry[]> {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    return request<Enquiry[]>(`/api/enquiries${qs}`);
  },

  async updateEnquiry(id: string, payload: { status?: string; admin_notes?: string }): Promise<Enquiry> {
    return request<Enquiry>(`/api/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteEnquiry(id: string): Promise<any> {
    return request(`/api/enquiries/${id}`, {
      method: 'DELETE',
    });
  },

  // 9. FAQs
  async getFaqs(all = false): Promise<FAQItem[]> {
    return request<FAQItem[]>(`/api/faqs${all ? '?all=true' : ''}`);
  },

  async createFaq(payload: Partial<FAQItem>): Promise<FAQItem> {
    return request<FAQItem>('/api/faqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateFaq(id: string, payload: Partial<FAQItem>): Promise<FAQItem> {
    return request<FAQItem>(`/api/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteFaq(id: string): Promise<any> {
    return request(`/api/faqs/${id}`, {
      method: 'DELETE',
    });
  },

  // 10. Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return request<DashboardMetrics>('/api/admin/dashboard');
  },
};
