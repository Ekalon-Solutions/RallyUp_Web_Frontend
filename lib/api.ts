const API_BASE_URL = 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  role: 'user' | 'admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  role: 'admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface News {
  _id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: string;
  maxAttendees: number;
  currentAttendees: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    console.log(`API request to ${endpoint} with token:`, token ? 'exists' : 'missing');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      console.log(`API ${endpoint} response:`, { status: response.status, data });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Authentication APIs
  async adminRegister(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    countryCode: string;
    adminCode: string;
  }): Promise<ApiResponse<{ token: string; admin: Admin }>> {
    return this.request('/admin/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminLogin(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; admin: Admin }>> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminProfile(): Promise<ApiResponse<Admin>> {
    return this.request('/admin/profile');
  }

  async userRegister(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    countryCode: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async userLogin(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async userProfile(): Promise<ApiResponse<User>> {
    return this.request('/users/profile');
  }

  async updateUserProfile(data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin Member Management APIs
  async getMembers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<{
    members: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/admin/members${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getMemberById(id: string): Promise<ApiResponse<User>> {
    return this.request(`/admin/members/${id}`);
  }

  async updateMember(id: string, data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    isPhoneVerified?: boolean;
    isActive?: boolean;
    role?: string;
    newPassword?: string;
  }): Promise<ApiResponse<User>> {
    return this.request(`/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMember(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/members/${id}`, {
      method: 'DELETE',
    });
  }

  async getMemberStats(): Promise<ApiResponse<{
    totalMembers: number;
    activeMembers: number;
    verifiedMembers: number;
    newMembersThisMonth: number;
    inactiveMembers: number;
    unverifiedMembers: number;
  }>> {
    return this.request('/admin/members/stats');
  }

  // News APIs
  async getNews(): Promise<ApiResponse<News[]>> {
    return this.request('/news');
  }

  async getPublicNews(): Promise<ApiResponse<News[]>> {
    return this.request('/news/public');
  }

  async getNewsById(id: string): Promise<ApiResponse<News>> {
    return this.request(`/news/${id}`);
  }

  async createNews(data: {
    title: string;
    content: string;
    tags: string[];
    isPublished: boolean;
  }): Promise<ApiResponse<{ message: string; news: News }>> {
    return this.request('/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNews(id: string, data: {
    title?: string;
    content?: string;
    tags?: string[];
    isPublished?: boolean;
  }): Promise<ApiResponse<{ message: string; news: News }>> {
    return this.request(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNews(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/news/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleNewsPublish(id: string, isPublished: boolean): Promise<ApiResponse<{ message: string; news: News }>> {
    return this.request(`/news/${id}/toggle-publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    });
  }

  // Events APIs
  async getEvents(): Promise<ApiResponse<Event[]>> {
    return this.request('/events');
  }

  async getPublicEvents(): Promise<ApiResponse<Event[]>> {
    return this.request('/events/public');
  }

  async getEventById(id: string): Promise<ApiResponse<Event>> {
    return this.request(`/events/${id}`);
  }

  async createEvent(data: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    maxAttendees: number;
    isPublished: boolean;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    category?: string;
    maxAttendees?: number;
    isPublished?: boolean;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleEventPublish(id: string, isPublished: boolean): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${id}/toggle-publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    });
  }

  async registerForEvent(id: string, userId: string): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/public/${id}/register`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 