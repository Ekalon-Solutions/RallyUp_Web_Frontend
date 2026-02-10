import { getApiUrl } from './config';
import { triggerBlobDownload } from './utils';

const API_BASE_URL = getApiUrl('');

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorDetails?: {
    status?: number;
    statusText?: string;
    endpoint?: string;
    url?: string;
    details?: any;
    type?: string;
  };
  status?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  role: 'member';
  club?: Club;
  membershipPlan?: string;
  membershipExpiry?: string;
  isActive?: boolean;
  volunteering?: VolunteerProfile;
  notificationPreferences?: {
    events: boolean;
    membershipRenewals: boolean;
    membershipExpiry: boolean;
    newMerchandise: boolean;
    pollResults: boolean;
    newsUpdates: boolean;
    orders?: boolean;
    refunds?: boolean;
    ticketStatus?: boolean;
  };
  memberships?: Array<{
    _id: string;
    club_id?: {
      _id: string;
      name: string;
      description?: string;
      logo?: string;
      status: string;
    };
    membership_level_id: {
      _id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      features: any;
    };
    status: 'active' | 'pending' | 'expired' | 'cancelled';
    start_date: string;
    end_date?: string;
  }>;
  profilePicture?: string;
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
  role: 'admin' | 'super_admin';
  club?: Club;
  clubs?: Club[];
  isActive?: boolean;
  volunteering?: VolunteerProfile;
  notificationPreferences?: {
    events: boolean;
    membershipRenewals: boolean;
    membershipExpiry: boolean;
    newMerchandise: boolean;
    pollResults: boolean;
    newsUpdates: boolean;
    orders?: boolean;
    refunds?: boolean;
    ticketStatus?: boolean;
  };
  profilePicture?: string;
  memberships?: Array<{
    _id: string;
    club_id: {
      _id: string;
      name: string;
      description?: string;
      logo?: string;
      status: string;
    };
    membership_level_id: {
      _id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
      features: any;
    };
    status: 'active' | 'pending' | 'expired' | 'cancelled';
    start_date: string;
    end_date?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemOwner {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  isPhoneVerified: boolean;
  role: 'system_owner';
  isActive?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationCTA {
  label: string;
  url: string;
}

export interface InAppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  cta?: NotificationCTA;
  metadata?: any;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}



export interface News {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  author: string;
  authorId: string;
  authorModel: 'Admin' | 'User';
  club: Club;
  tags: string[];
  category: 'general' | 'event' | 'announcement' | 'update' | 'achievement';
  priority: 'low' | 'medium' | 'high';
  isPublished: boolean;
  publishedAt?: string;
  images: string[];
  featuredImage?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chant {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  fileType: 'text' | 'image' | 'audio' | 'iframe';
  fileName?: string;
  fileUrl?: string;
  iframeUrl?: string;
  iframeWidth?: string;
  iframeHeight?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  club: Club;
  createdBy: User;
  isActive: boolean;
  tags?: string[];
  fileTypeDisplay?: string;
  formattedFileSize?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  eventDate: string;
  eventTime: string;
  isPublished: any;
  _id: string;
  title: string;
  category: string;
  startTime: string;
  endTime?: string;
  venue: string;
  description: string;
  bookingStartTime: string;
  bookingEndTime: string;
  maxAttendees?: number;
  ticketPrice: number;
  requiresTicket: boolean;
  memberOnly: boolean;
  clubId?: string;
  awayDayEvent: boolean;
  isActive: boolean;
  registrations?: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    registrationDate: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    notes?: string;
  }>;
  currentAttendees: number;
  earlyBirdDiscount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
    startTime: string,
    endTime: string,
  }
  waitlist?: {
    enabled: boolean;
    percentage: number;
    purchaseWindowHours: number;
  }
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerOpportunity {
  _id: string;
  title: string;
  description: string;
  club: string;
  event?: string;
  requiredSkills: string[];
  timeSlots: {
    _id: string;
    startTime: string;
    endTime: string;
    volunteersNeeded: number;
    volunteersAssigned: string[];
  }[];
  status: 'draft' | 'open' | 'filled' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Volunteer {
  _id: string;
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  };
  club: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  skills: string[];
  interests: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
    flexible: boolean;
  };
  experience: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    previousRoles: string[];
  };
  preferences: {
    preferredEventTypes: string[];
    maxHoursPerWeek: number;
    preferredTimeSlots: string[];
    locationPreference: 'on-site' | 'remote' | 'both';
  };
  status: 'available' | 'busy' | 'unavailable' | 'on-assignment';
  notes: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  certifications: {
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    certificateNumber?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerProfile {
  isVolunteer: boolean;
  interests: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
  };
  skills: string[];
  notes: string;
}

export interface Club {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone: string;
  is_deleted?: boolean;
  deletedAt?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  settings: {
    allowPublicRegistration: boolean;
    requireApproval: boolean;
    maxMembers: number;
    membershipPlans: string[];
  };
  status: 'active' | 'inactive' | 'suspended';
  createdBy: string;
  superAdmin: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipCard {
  _id: string;
  cardNumber: string;
  cardStyle: 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald';
  status: 'active' | 'expired' | 'pending' | 'suspended';
  issueDate: string;
  expiryDate: string;
  accessLevel: 'basic' | 'premium' | 'vip';
  features: {
    maxEvents: number;
    maxNews: number;
    maxMembers: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
  qrCode?: string;
  barcode?: string;
  isDigitalCard: boolean;
  isPhysicalCard: boolean;
  membershipId?: string | null;
  customization?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoSize: 'small' | 'medium' | 'large';
    showLogo: boolean;
    customLogo?: string;
  };
}

export interface PublicClubInfo {
  _id: string;
  name: string;
  logo?: string;
  location?: string;
  description?: string;
  website?: string;
}

export interface PublicMembershipPlanInfo {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: {
    maxEvents: number;
    maxNews: number;
    maxMembers: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
}

export interface PublicMembershipCardDisplay {
  card: MembershipCard;
  club: PublicClubInfo;
  membershipPlan: PublicMembershipPlanInfo;
}

export interface CreateMembershipCardRequest {
  membershipPlanId: string;
  clubId: string;
  cardStyle?: 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald';
  expiryDate?: string;
  accessLevel?: 'basic' | 'premium' | 'vip';
  customization?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoSize?: 'small' | 'medium' | 'large';
    showLogo?: boolean;
    customLogo?: string;
  };
}

export interface UpdateMembershipCardRequest {
  cardStyle?: 'default' | 'premium' | 'vintage' | 'modern' | 'elite' | 'emerald';
  status?: 'active' | 'expired' | 'pending' | 'suspended';
  expiryDate?: string;
  accessLevel?: 'basic' | 'premium' | 'vip';
  features?: Partial<{
    maxEvents: number;
    maxNews: number;
    maxMembers: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  }>;
  customization?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    logoSize?: 'small' | 'medium' | 'large';
    showLogo?: boolean;
    customLogo?: string;
  };
}

export interface RenewMembershipCardRequest {
  newExpiryDate: string;
}

export interface MembershipPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: {
    maxEvents: number;
    maxNews: number;
    maxMembers: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  };
  isActive: boolean;
  club: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  _id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  _id: string;
  question: string;
  description?: string;
  options: PollOption[];
  club: Club;
  createdBy: string;
  createdByModel: 'Admin' | 'User';
  createdByName: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  startDate?: string;
  endDate?: string;
  totalVotes: number;
  totalVoters: number;
  isPublic: boolean;
  tags: string[];
  category: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  userVotes?: string[];
}

export interface ExternalTicketRequest {
  _id: string;
  club_id: Club;
  user_id?: User;
  user_name: string;
  phone: string;
  countryCode?: string;
  tickets: number;
  preferred_date: string;
  comments?: string;
  status: 'fulfilled' | 'rejected' | 'on_hold' | 'pending' | 'cancelled_by_member' | 'unfulfilled';
  fixture_id?: Event | string;
  competition?: string;
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
    const url = `${this.baseURL}${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
    const token = this.getToken();
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const config: RequestInit = {
      headers,
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || `HTTP ${response.status} error` };
      }
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          url: response.url,
          ...(data.details && { details: data.details })
        };
        
        return {
          success: false,
          error: errorMessage,
          message: data.message,
          errorDetails,
          status: response.status
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        errorDetails: {
          endpoint,
          url,
          type: 'network_error'
        }
      };
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return token;
    }
    return null;
  }

  async get<T = any>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (options?.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url);
  }

  async post<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'POST',
    };

    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    return this.request<T>(endpoint, requestOptions);
  }

  async put<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'PUT',
    };

    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    return this.request<T>(endpoint, requestOptions);
  }

  async patch<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'PATCH',
    };

    if (data instanceof FormData) {
      requestOptions.body = data;
    } else if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    return this.request<T>(endpoint, requestOptions);
  }

  async delete<T = any>(endpoint: string, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const requestOptions: RequestInit = {
      method: 'DELETE',
    };

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    return this.request<T>(endpoint, requestOptions);
  }

  async adminRegister(data: {
    name: string;
    email: string;
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
    email?: string;
    phoneNumber?: string;
    username?: string;
  }): Promise<ApiResponse<{ token: string; admin: Admin }>> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminProfile(): Promise<ApiResponse<Admin>> {
    return this.request('/admin/profile');
  }

  async adminLogAttendance(data: { registrationId?: string | null; attendeeId?: string | null;}): Promise<ApiResponse<any>> {
    return this.request('/events/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async userRegister(data: {
    name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    clubId?: string;
    membershipPlanId?: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async userLogin(data: {
    email?: string;
    phoneNumber?: string;
    username?: string;
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
    profilePicture?: string;
    notificationPreferences?: {
      events?: boolean;
      membershipRenewals?: boolean;
      membershipExpiry?: boolean;
      newMerchandise?: boolean;
      pollResults?: boolean;
      newsUpdates?: boolean;
      orders?: boolean;
      refunds?: boolean;
      ticketStatus?: boolean;
    };
  }): Promise<ApiResponse<User>> {
    const userStr = localStorage.getItem('user');
    const userRole = JSON.parse(userStr || "{}")?.role || localStorage.getItem('userType');
    let endpoint = '/users/profile';
    
    if (userRole) {
      try {
        if (userRole === 'system_owner') {
          endpoint = '/system-owner/profile';
        } else if (userRole === 'admin' || userRole === 'super_admin') {
          endpoint = '/admin/profile';
        }
      } catch (e) {
      }
    }

    const backendData: any = {};
    
    if (endpoint === '/users/profile') {
      if (data.name) {
        const nameParts = data.name.trim().split(' ');
        backendData.first_name = nameParts[0] || '';
        backendData.last_name = nameParts.slice(1).join(' ') || nameParts[0] || '';
      }
      
      if (data.phoneNumber !== undefined) {
        backendData.phoneNumber = data.phoneNumber;
      }
      
      if (data.countryCode !== undefined) {
        backendData.countryCode = data.countryCode;
      }
    } else {
      if (data.name !== undefined) {
        backendData.name = data.name;
      }
      
      if (data.phoneNumber !== undefined) {
        backendData.phoneNumber = data.phoneNumber;
      }
      
      if (data.countryCode !== undefined) {
        backendData.countryCode = data.countryCode;
      }
    }
    
    if (data.email !== undefined) {
      backendData.email = data.email;
    }

    if (data.profilePicture !== undefined) {
      backendData.profilePicture = data.profilePicture;
    }

    if (data.notificationPreferences !== undefined) {
      backendData.notificationPreferences = data.notificationPreferences;
    }

    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
  }

  async uploadProfilePicture(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.request('/upload/profile-picture', {
      method: 'POST',
      body: formData,
    });
  }

  async getUserProfile(): Promise<ApiResponse<User & {
    notificationPreferences?: {
      events: boolean;
      membershipRenewals: boolean;
      membershipExpiry: boolean;
      newMerchandise: boolean;
      pollResults: boolean;
      newsUpdates: boolean;
      orders?: boolean;
      refunds?: boolean;
      ticketStatus?: boolean;
    };
  }>> {
    return this.request('/users/profile');
  }

  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<{
    notifications: InAppNotification[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>> {
    return this.get('/notifications', { params });
  }

  async getUnreadNotificationsCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.get('/notifications/unread-count');
  }

  async markInAppNotificationRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.post(`/notifications/${notificationId}/read`);
  }

  async markAllInAppNotificationsRead(): Promise<ApiResponse<{ success: boolean; modifiedCount: number }>> {
    return this.post('/notifications/read-all');
  }
  
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

  async getMemberPoints(id: string, clubId?: string): Promise<ApiResponse<{ points: number; entries?: any[] }>> {
    const endpoint = `/users/members/${id}/points${clubId ? `?clubId=${encodeURIComponent(clubId)}` : ''}`;
    return this.request(endpoint);
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

  async deleteMember(id: string, clubId?: string | null): Promise<ApiResponse<{ message: string }>> {
    const query = clubId ? `?clubId=${encodeURIComponent(clubId)}` : '';
    return this.request(`/admin/members/${id}${query}`, {
      method: 'DELETE',
    });
  }

  async deleteMembersBulk(memberIds: string[], clubId?: string | null): Promise<ApiResponse<{ message: string; deletedCount: number }>> {
    return this.request('/admin/members/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ memberIds, clubId: clubId ?? undefined }),
    });
  }

  async deleteAllClubMembers(clubId?: string | null): Promise<ApiResponse<{ message: string; deletedCount: number }>> {
    return this.request('/admin/members/delete-all', {
      method: 'POST',
      body: clubId ? JSON.stringify({ clubId }) : undefined,
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

  async getNews(params?: {
    clubId?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    news: News[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    return this.get('/news', { params });
  }

  async getPublicNews(clubId?: string): Promise<ApiResponse<News[]>> {
    const endpoint = clubId ? `/news/public?clubId=${clubId}` : '/news/public';
    return this.request(endpoint);
  }

  async getNewsByMyClub(): Promise<ApiResponse<News[]>> {
    return this.request('/news/my-club');
  }
  
  async getAllClubs(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const query: Record<string, any> = {};
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    if (params?.search) query.search = params.search;
    if (params?.status) query.status = params.status;
    const qs = Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : '';
    return this.request(`/clubs${qs}`);
  }

  async getNewsByUserClub(clubId?: string): Promise<ApiResponse<any>> {
    const endpoint = clubId ? `/news/my-club?clubId=${encodeURIComponent(clubId)}` : '/news/my-club';
    return this.request(endpoint);
  }

  async getNewsById(id: string): Promise<ApiResponse<News>> {
    return this.request(`/news/${id}`);
  }
  
  async getPublicNewsById(id: string): Promise<ApiResponse<News>> {
    return this.request(`/news/public/${id}`);
  }

  async createNews(data: FormData): Promise<ApiResponse<{ message: string; news: News }>> {
    return this.request('/news', {
      method: 'POST',
      body: data,
    });
  }

  async updateNews(id: string, data: FormData): Promise<ApiResponse<{ message: string; news: News }>> {
    return this.request(`/news/${id}`, {
      method: 'PUT',
      body: data,
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

  async getNewsStats(clubId?: string): Promise<ApiResponse<{
    stats: {
      total: number;
      published: number;
      drafts: number;
      totalViews: number;
    };
    categoryStats: { _id: string; count: number }[];
    priorityStats: { _id: string; count: number }[];
  }>> {
    const endpoint = clubId ? `/news/stats?clubId=${clubId}` : '/news/stats';
    return this.request(endpoint);
  }

  async getEvents(): Promise<ApiResponse<Event[]>> {
    return this.request('/events');
  }

  async getEventsByClub(clubId?: string): Promise<ApiResponse<Event[]>> {
    const endpoint = clubId ? `/events/club?clubId=${encodeURIComponent(clubId)}` : '/events/club';
    return this.request(endpoint);
  }

  async getPublicEvents(clubId?: string): Promise<ApiResponse<Event[]>> {
    const endpoint = clubId ? `/events/public?clubId=${clubId}` : '/events/public';
    return this.request(endpoint);
  }

  async getPublicEventById(id: string): Promise<ApiResponse<Event>> {
    return this.request(`/events/public/${id}`);
  }

  async getEventById(id: string): Promise<ApiResponse<Event>> {
    return this.request(`/events/${id}`);
  }

  async createExternalTicketRequest(data: {
    clubId: string;
    userName: string;
    phone: string;
    countryCode?: string;
    tickets?: number;
    preferredDate: string;
    comments?: string;
  }): Promise<ApiResponse<ExternalTicketRequest>> {
    return this.request('/external-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExternalTicketRequest(id: string): Promise<ApiResponse<ExternalTicketRequest>> {
    return this.request(`/external-tickets/${id}`);
  }

  async listExternalTicketRequestsForClub(clubId: string, params?: { 
    status?: string; 
    fixtureId?: string; 
    competition?: string; 
    page?: number; 
    limit?: number 
  }) {
    const query: Record<string, any> = {};
    if (params?.status) query.status = params.status;
    if (params?.fixtureId) query.fixtureId = params.fixtureId;
    if (params?.competition) query.competition = params.competition;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    return this.request(`/external-tickets/club/${clubId}` + (Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : ''));
  }

  async updateExternalTicketRequestStatus(id: string, status: 'fulfilled' | 'rejected' | 'on_hold' | 'pending' | 'cancelled_by_member' | 'unfulfilled') {
    return this.request(`/external-tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async bulkUpdateExternalTicketRequestStatus(ids: string[], status: 'fulfilled' | 'rejected' | 'on_hold' | 'pending' | 'cancelled_by_member' | 'unfulfilled') {
    return this.request('/external-tickets/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status }),
    });
  }

  async exportExternalTicketRequests(clubId: string, params?: { 
    status?: string; 
    fixtureId?: string; 
    competition?: string; 
    format?: 'csv' | 'xlsx' 
  }) {
    const query: Record<string, any> = {};
    if (params?.status) query.status = params.status;
    if (params?.fixtureId) query.fixtureId = params.fixtureId;
    if (params?.competition) query.competition = params.competition;
    if (params?.format) query.format = params.format;
    return this.downloadFile(`/external-tickets/club/${clubId}/export` + (Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : ''));
  }

  async createEvent(data: {
    title: string;
    category: string;
    startTime: string;
    endTime?: string;
    venue: string;
    description: string;
    maxAttendees?: number;
    ticketPrice: number;
    requiresTicket: boolean;
    memberOnly: boolean;
    clubId?: string;
    awayDayEvent: boolean;
    bookingStartTime?: string;
    bookingEndTime?: string;
    earlyBirdDiscount?: any;
    memberDiscount?: any;
    groupDiscount?: any;
    waitlist?: { enabled: boolean; percentage?: number; purchaseWindowHours?: number };
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: {
    title?: string;
    category?: string;
    startTime?: string;
    endTime?: string;
    venue?: string;
    description?: string;
    maxAttendees?: number;
    ticketPrice?: number;
    requiresTicket?: boolean;
    memberOnly?: boolean;
    clubId?: string;
    awayDayEvent?: boolean;
    waitlist?: { enabled?: boolean; percentage?: number; purchaseWindowHours?: number };
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

  async toggleEventStatus(id: string, isActive: boolean): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async registerForEvent(eventId: string, notes?: string, attendees?: Array<{ name: string; phone: string }>, couponCode?: string | null, orderID?: string, paymentID?: string, signature?: string, waitlistToken?: string): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes, attendees, couponCode, orderID, paymentID, signature, waitlistToken }),
    });
  }

  async registerForPublicEvent(eventId: string, data: {
    registrantName: string;
    registrantEmail?: string;
    registrantPhone?: string;
    notes?: string;
    attendees?: Array<{ name: string; phone: string }>;
    couponCode?: string | null;
    orderID?: string;
    paymentID?: string;
    signature?: string;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/public/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelEventRegistration(eventId: string): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${eventId}/register`, {
      method: 'DELETE',
    });
  }

  async joinWaitlist(eventId: string): Promise<ApiResponse<{ message: string; position: number; eventId: string }>> {
    return this.request(`/events/${eventId}/waitlist`, {
      method: 'POST',
    });
  }

  async declineWaitlistOffer(eventId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/events/${eventId}/waitlist/decline`, {
      method: 'POST',
    });
  }

  async getMyWaitlistStatus(): Promise<ApiResponse<Array<{
    eventId: string;
    eventTitle: string;
    eventStartTime: string;
    eventVenue: string;
    position: number;
    status: 'pending' | 'notified';
    purchaseLinkExpiresAt?: string;
  }>>> {
    return this.request('/events/waitlist/my-status');
  }

  async validateWaitlistToken(eventId: string, token: string): Promise<ApiResponse<{ valid: boolean; event?: Event }>> {
    return this.request(`/events/waitlist/validate-token?eventId=${encodeURIComponent(eventId)}&token=${encodeURIComponent(token)}`);
  }

  async getEventRegistrations(eventId: string): Promise<ApiResponse<{
    registrations: Array<{
      userId: string;
      userName: string;
      userEmail: string;
      registrationDate: string;
      status: 'confirmed' | 'pending' | 'cancelled';
      notes?: string;
    }>;
    currentAttendees: number;
    maxAttendees?: number;
  }>> {
    return this.request(`/events/${eventId}/registrations`);
  }

  async getRegistrationById(registrationId: string): Promise<ApiResponse<{ registration: any }>> {
    return this.request(`/events/registration/${registrationId}`);
  }

  async getUserEventRegistrations(): Promise<ApiResponse<Array<{
    eventId: string;
    eventTitle: string;
    eventStartTime: string;
    eventVenue: string;
    eventCategory: string;
    registration: {
      userId: string;
      userName: string;
      userEmail: string;
      registrationDate: string;
      status: 'confirmed' | 'pending' | 'cancelled';
      notes?: string;
    };
  }>>> {
    return this.request('/events/my-registrations');
  }

  async getLeaderboard(): Promise<ApiResponse<{
    leaderboard: Array<{
      userId: string;
      name?: string;
      email?: string;
      avatar?: string;
      club?: string;
      eventCount: number;
      points: number;
    }>;
  }>> {
    return this.request('/leaderboard');
  }

  async updateLeaderboardPoints(userId: string, points: number): Promise<ApiResponse<any>> {
    return this.request(`/leaderboard/${encodeURIComponent(userId)}/points`, {
      method: 'PATCH',
      body: JSON.stringify({ points }),
    });
  }

  async getVolunteers(params?: {
    club?: string;
    skills?: string[];
    availability?: string[];
    status?: 'available' | 'busy' | 'unavailable' | 'on-assignment';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<Volunteer[]>> {
    const queryParams = new URLSearchParams();
    if (params?.club) queryParams.append('club', params.club);
    if (params?.skills) params.skills.forEach(skill => queryParams.append('skills', skill));
    if (params?.availability) params.availability.forEach(avail => queryParams.append('availability', avail));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/volunteer/volunteers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getVolunteerOpportunities(params?: {
    club?: string;
    category?: string;
    status?: 'active' | 'inactive' | 'completed';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<VolunteerOpportunity[]>> {
    const queryParams = new URLSearchParams();
    if (params?.club) queryParams.append('club', params.club);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/volunteer/opportunities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createVolunteerOpportunity(opportunity: any): Promise<ApiResponse<VolunteerOpportunity>> {
    return this.request('/volunteer/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunity)
    });
  }

  async updateVolunteerOpportunity(id: string, opportunity: any): Promise<ApiResponse<VolunteerOpportunity>> {
    return this.request(`/volunteer/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(opportunity)
    });
  }

  async deleteVolunteerOpportunity(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/volunteer/opportunities/${id}`, {
      method: 'DELETE'
    });
  }



  async registerForVolunteerOpportunity(opportunityId: string, timeSlotId: string, volunteerData?: {
    notes?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<ApiResponse<{ message: string; opportunity: VolunteerOpportunity }>> {
    return this.request(`/volunteer/opportunities/${opportunityId}/signup`, {
      method: 'POST',
      body: JSON.stringify({ timeSlotId, ...volunteerData }),
    });
  }

  async signUpForVolunteerOpportunity(opportunityId: string, timeSlotId: string, volunteerData?: {
    notes?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }): Promise<ApiResponse<{ message: string; opportunity: VolunteerOpportunity }>> {
    return this.registerForVolunteerOpportunity(opportunityId, timeSlotId, volunteerData);
  }

  async withdrawFromVolunteerOpportunity(opportunityId: string, timeSlotId: string): Promise<ApiResponse<{ message: string; opportunity: VolunteerOpportunity }>> {
    return this.request(`/volunteer/opportunities/${opportunityId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ timeSlotId }),
    });
  }

  async getVolunteerSignupsForOpportunity(opportunityId: string): Promise<ApiResponse<{
    opportunityId: string;
    opportunityTitle: string;
    timeSlotId: string;
    startTime: string;
    endTime: string;
    date: string;
    volunteer: User;
    status: string;
  }[]>> {
    return this.request(`/volunteer/opportunities/${opportunityId}/signups`);
  }

  async assignVolunteerToOpportunity(data: {
    opportunityId: string;
    timeSlotId: string;
    volunteerId: string;
    notes?: string;
  }): Promise<ApiResponse<{ message: string; opportunity: VolunteerOpportunity }>> {
    return this.request('/volunteer/opportunities/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unassignVolunteerFromOpportunity(data: {
    opportunityId: string;
    timeSlotId: string;
    volunteerId: string;
  }): Promise<ApiResponse<{ message: string; opportunity: VolunteerOpportunity }>> {
    return this.request('/volunteer/opportunities/unassign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAvailableVolunteersForOpportunity(params: {
    opportunityId: string;
    timeSlotId: string;
  }): Promise<ApiResponse<{
    availableVolunteers: Volunteer[];
    total: number;
    requiredSkills: string[];
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('opportunityId', params.opportunityId);
    queryParams.append('timeSlotId', params.timeSlotId);
    
    return this.request(`/volunteer/opportunities/available-volunteers?${queryParams.toString()}`);
  }

  async updateVolunteerSignupStatus(opportunityId: string, signupId: string, status: 'confirmed' | 'pending' | 'cancelled'): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/volunteer/opportunities/${opportunityId}/signups/${signupId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getVolunteerHistory(params?: {
    page?: number;
    limit?: number;
    status?: 'completed' | 'cancelled' | 'all';
  }): Promise<ApiResponse<{
    history: {
      _id: string;
      opportunity: VolunteerOpportunity;
      timeSlot: {
        startTime: string;
        endTime: string;
        date?: string;
      };
      status: 'completed' | 'cancelled';
      hours: number;
      date: string;
    }[];
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
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/volunteer/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getAvailableSkills(): Promise<ApiResponse<string[]>> {
    return this.request('/volunteer/skills');
  }

  async getVolunteerTrainingMaterials(clubId?: string): Promise<ApiResponse<{
    materials: {
      _id: string;
      title: string;
      description: string;
      type: 'document' | 'video' | 'link';
      url: string;
      requiredSkills: string[];
      estimatedTime: number;
      createdAt: string;
    }[];
  }>> {
    const endpoint = clubId ? `/volunteer/training?clubId=${clubId}` : '/volunteer/training';
    return this.request(endpoint);
  }

  async getVolunteerProfile(): Promise<ApiResponse<VolunteerProfile>> {
    return this.request('/volunteer/volunteer-profile');
  }

  async createVolunteerProfile(data: {
    interests: string[];
    availability: {
      weekdays: boolean;
      weekends: boolean;
      evenings: boolean;
    };
    skills: string[];
    notes?: string;
  }): Promise<ApiResponse<VolunteerProfile>> {
    return this.request('/volunteer/volunteer-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVolunteerProfile(data: {
    interests?: string[];
    availability?: {
      weekdays?: boolean;
      weekends?: boolean;
      evenings?: boolean;
    };
    skills?: string[];
    notes?: string;
  }): Promise<ApiResponse<VolunteerProfile>> {
    return this.request('/volunteer/volunteer-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async markTrainingCompleted(trainingId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/volunteer/training/${trainingId}/complete`, {
      method: 'POST',
    });
  }

  async sendVolunteerNotification(volunteerIds: string[], message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<ApiResponse<{ message: string; sentCount: number }>> {
    return this.request('/volunteer/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ volunteerIds, message, priority }),
    });
  }

  async getVolunteerNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
  }): Promise<ApiResponse<{
    notifications: {
      _id: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
      read: boolean;
      createdAt: string;
    }[];
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
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());

    const endpoint = `/volunteer/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/volunteer/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async getVolunteerReport(params: {
    startDate: string;
    endDate: string;
    clubId?: string;
    reportType: 'hours' | 'opportunities' | 'skills' | 'demographics';
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    if (params.clubId) queryParams.append('clubId', params.clubId);
    queryParams.append('reportType', params.reportType);

    const endpoint = `/volunteer/reports?${queryParams.toString()}`;
    return this.request(endpoint);
  }

  async exportVolunteerData(params: {
    startDate: string;
    endDate: string;
    clubId?: string;
    format: 'csv' | 'excel' | 'pdf';
  }): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    if (params.clubId) queryParams.append('clubId', params.clubId);
    queryParams.append('format', params.format);

    const endpoint = `/volunteer/export?${queryParams.toString()}`;
    return this.request(endpoint);
  }

  async downloadFile(endpoint: string, options?: { params?: Record<string, any> }): Promise<{ success: boolean; blob?: Blob; filename?: string; error?: string }> {
    try {
      let url = endpoint;
      if (options?.params) {
        const queryParams = new URLSearchParams();
        Object.entries(options.params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) queryParams.append(k, v.toString());
        });
        const qs = queryParams.toString();
        if (qs) url += `?${qs}`;
      }

      const fullUrl = `${this.baseURL}${url}`;
      const token = this.getToken();

      const headers: Record<string, string> = {
        Accept: '*/*',
      };

      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${text}` };
      }

      const contentDisposition = response.headers.get('content-disposition') || '';
      let filename = '';
      const match = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/);
      if (match) {
        filename = decodeURIComponent((match[1] || match[2] || '').replace(/\"/g, ''));
      }

      const blob = await response.blob();
      return { success: true, blob, filename: filename || undefined };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Download failed' };
    }
  }

  async downloadOrdersReport(params?: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.downloadFile('/orders/admin/report', { params });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      const blob = result.blob as Blob;
      const filename = result.filename || `orders_report_${Date.now()}.xlsx`;
      triggerBlobDownload(blob, filename);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to download orders report' };
    }
  }

  async downloadMyOrdersReport(params?: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.downloadFile('/orders/my-orders/report', { params });
      if (!result.success) {
        return { success: false, error: result.error };
      }
      const blob = result.blob as Blob;
      const filename = result.filename || `my_orders_report_${Date.now()}.xlsx`;
      triggerBlobDownload(blob, filename);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to download my orders report' };
    }
  }

  async createClub(data: {
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    contactEmail: string;
    contactPhone: string;
    address?: any;
    settings?: any;
    superAdminEmail: string;
    superAdminPhone: string;
    superAdminCountryCode: string;
  }): Promise<ApiResponse<{ message: string; club: Club }>> {
    return this.request('/clubs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClubs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<{
    clubs: Club[];
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

    const endpoint = `/clubs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getPublicClubs(): Promise<ApiResponse<{
    clubs: Club[];
  }>> {
    return this.request('/clubs/public');
  }

  async getClubById(id: string, isPublic: boolean = false): Promise<ApiResponse<Club>> {
    const endpoint = isPublic ? `/clubs/${id}/public` : `/clubs/${id}`;
    
    if (isPublic) {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to fetch club data'
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    }
    
    return this.request(endpoint);
  }

  async generateClubDeletionOTP(params: {
    clubId: string;
    action: 'delete' | 'restore';
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    expiresIn: number;
    otpToken: string;
    otp?: string;
  }>> {
    return this.post('/auth/otp-generate', params);
  }

  async deleteClubWithOTP(params: {
    clubId: string;
    otpToken: string;
    otp?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
  }>> {
    return this.post('/clubs/delete', params);
  }

  async restoreClubWithOTP(params: {
    clubId: string;
    otpToken: string;
    otp?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    message: string;
    club?: Club;
  }>> {
    return this.post('/clubs/restore', params);
  }

  async updateClub(id: string, data: any): Promise<ApiResponse<{ message: string; club: Club }>> {
    return this.request(`/clubs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateClubBasicInfo(id: string, data: { 
    name: string; 
    description?: string;
    contactInfo?: string;
    slug?: string;
  }): Promise<ApiResponse<{ message: string; club: Club }>> {
    return this.patch(`/clubs/${id}/basic-info`, data);
  }

  async deleteClub(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/clubs/${id}`, {
      method: 'DELETE',
    });
  }

  async getClubStats(id: string): Promise<ApiResponse<any>> {
    return this.request(`/clubs/${id}/stats`);
  }

  async createMembershipPlan(data: {
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: number;
    features: any;
  }): Promise<ApiResponse<{ message: string; membershipPlan: MembershipPlan }>> {
    return this.request('/membership-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMembershipPlans(clubId?: string): Promise<ApiResponse<MembershipPlan[]>> {
    const endpoint = clubId ? `/membership-plans?clubId=${clubId}` : '/membership-plans';
    return this.request(endpoint);
  }

  async getMembershipPlanById(id: string): Promise<ApiResponse<MembershipPlan>> {
    return this.request(`/membership-plans/${id}`);
  }

  async updateMembershipPlan(id: string, data: any): Promise<ApiResponse<{ message: string; membershipPlan: MembershipPlan }>> {
    return this.request(`/membership-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMembershipPlan(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/membership-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async assignMembershipPlan(planId: string, userId: string): Promise<ApiResponse<{ message: string; user: User }>> {
    return this.request(`/membership-plans/${planId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async subscribeMembershipPlan(planId: string): Promise<ApiResponse<{ 
    message: string; 
    data: { 
      userMembership: any; 
      isUpgrade: boolean;
    } 
  }>> {
    return this.request(`/membership-plans/${planId}/subscribe`, {
      method: 'POST',
    });
  }

  async createAdmin(data: {
    name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }): Promise<ApiResponse<{ message: string; admin: User }>> {
    return this.request('/staff/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }



  async getStaff(params?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    staff: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/staff${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async updateStaff(id: string, data: any): Promise<ApiResponse<{ message: string; staffMember: User }>> {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  async getStaffStats(): Promise<ApiResponse<any>> {
    return this.request('/staff/stats');
  }

  async verifyPhoneNumber(data: {}): Promise<ApiResponse<any>> {
    return this.request('/phone/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPhoneVerificationStatus(userId: string, role: string): Promise<ApiResponse<{
    isPhoneVerified: boolean;
    phoneNumber: string;
  }>> {
    return this.request(`/phone/status/${userId}?role=${role}`);
  }

  async getStaffByClub(clubId: string, params?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    staff: User[];
    club: {
      _id: string;
      name: string;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/staff/club/${clubId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createStaffForClub(clubId: string, data: {
    name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    role: 'admin' | 'volunteer';
  }): Promise<ApiResponse<{ message: string; staffMember: User }>> {
    return this.request(`/staff/club/${clubId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaffForClub(clubId: string, staffId: string, data: any): Promise<ApiResponse<{ message: string; staffMember: User }>> {
    return this.request(`/staff/club/${clubId}/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaffForClub(clubId: string, staffId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/staff/club/${clubId}/${staffId}`, {
      method: 'DELETE',
    });
  }

  async systemOwnerRegister(data: {
    name: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
    accessKey: string;
  }): Promise<ApiResponse<{ token: string; systemOwner: SystemOwner }>> {
    return this.request('/system-owner/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async systemOwnerLogin(data: {
    email?: string;
    phoneNumber?: string;
    username?: string;
  }): Promise<ApiResponse<{ token: string; systemOwner: SystemOwner }>> {
    return this.request('/system-owner/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async systemOwnerProfile(): Promise<ApiResponse<SystemOwner>> {
    return this.request('/system-owner/profile');
  }

  async getUserClub(): Promise<ApiResponse<{
    club: Club;
    membershipPlan?: string;
    membershipExpiry?: string;
  }>> {
    return this.request('/users/club');
  }

  async getAdminClub(): Promise<ApiResponse<{
    club: Club;
  }>> {
    return this.request('/admin/club');
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const endpoint = `/users/search?q=${encodeURIComponent(query)}`;
    const response = await this.request<any>(endpoint);
    const users = response.success ? (Array.isArray(response.data) ? response.data : []) : [];

    return {
      success: response.success,
      data: users,
      error: response.error
    };
  }

  async searchAdmins(query: string): Promise<ApiResponse<Admin[]>> {
    const endpoint = `/admin/search?q=${encodeURIComponent(query)}`;
    const response = await this.request<any>(endpoint);
    const responseData = response.data || response;
    const admins = responseData.success ? (Array.isArray(responseData.data) ? responseData.data : []) : [];

    return {
      success: responseData.success,
      data: admins,
      error: responseData.error
    };
  }

  async adminAddMember(data: {
    email: string;
    name: string;
    phoneNumber: string;
    countryCode?: string;
    club_id: string;
    membership_plan_id?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    zip_code?: string;
    country?: string;
    id_proof_type?: string;
    id_proof_number?: string;
  }): Promise<ApiResponse<{ message: string; userMembership: unknown; existingUser?: boolean; alreadyMember?: boolean }>> {
    return this.request('/user-memberships/admin-add', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addMemberWithDefaultPlan(data: { user_id: string; club_id: string }): Promise<ApiResponse<{ message: string; userMembership: unknown }>> {
    return this.request('/user-memberships/add-with-default', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async findUserByEmailOrPhone(data: {
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
  }): Promise<ApiResponse<{ user: { _id: string; email: string; phoneNumber: string; first_name: string; last_name: string; name: string } }>> {
    return this.request('/users/find-by-credentials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async joinClub(data: {
    clubId: string;
    membershipPlanId?: string;
  }): Promise<ApiResponse<{ message: string; user: User }>> {
    return this.request('/users/join-club-request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async leaveClub(): Promise<ApiResponse<{ message: string; user: User }>> {
    return this.request('/users/leave-club', {
      method: 'POST'
    });
  }

  async getMemberDirectory(params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'inactive';
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
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `/users/directory${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getClubMemberDirectory(params: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    verification?: 'verified' | 'unverified';
    clubId: string;
  }): Promise<ApiResponse<{
    members: User[];
    metadata: {
      total: number;
      active: number;
      verified: number;
      thisMonth: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.verification) queryParams.append('verification', params.verification);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.clubId) queryParams.append('clubId', params.clubId);

    const endpoint = `/users/club-directory${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getUserMembershipId(userId: string, clubId: string): Promise<ApiResponse<{
    membershipId: string;
    status: string;
    startDate: string;
    endDate?: string;
    membershipLevel: string;
  }>> {
    return this.request(`/users/membership-id/${userId}/${clubId}`);
  }
  
  async getUserMemberships(): Promise<ApiResponse<Array<{
    _id: string;
    club_id: {
      _id: string;
      name: string;
      description: string;
      status: string;
    };
    membership_level_id: {
      _id: string;
      name: string;
      description: string;
      price: number;
      currency: string;
    };
    level_name: string;
    status: string;
    start_date: string;
    end_date?: string;
    user_membership_id: string;
  }>>> {
    return this.request('/users/memberships');
  }

  async debugVolunteers(): Promise<ApiResponse<any>> {
    return this.request('/volunteer/debug-volunteers');
  }

  async getMyMembershipCards(): Promise<ApiResponse<PublicMembershipCardDisplay[]>> {
    return this.request('/membership-cards/my-cards');
  }

  async getMyClubMembershipCards(): Promise<ApiResponse<PublicMembershipCardDisplay[]>> {
    return this.request('/membership-cards/my-club-cards');
  }

  async createMyMembershipCard(clubId?: string): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request('/membership-cards/create-my-card', {
      method: 'POST',
      body: clubId ? JSON.stringify({ clubId }) : undefined
    });
  }

  async fixMyMembershipCard(): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request('/membership-cards/fix-my-card', {
      method: 'POST',
    });
  }

  async getMembershipCard(cardId: string): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request(`/membership-cards/${cardId}`);
  }

  async createMembershipCard(data: CreateMembershipCardRequest): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request('/membership-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClubMembershipCards(clubId: string, params?: {
    status?: string;
    cardStyle?: string;
    accessLevel?: string;
    isExpired?: boolean;
    isActive?: boolean;
    isTemplate?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    data: PublicMembershipCardDisplay[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cardStyle) queryParams.append('cardStyle', params.cardStyle);
    if (params?.accessLevel) queryParams.append('accessLevel', params.accessLevel);
    if (params?.isExpired !== undefined) queryParams.append('isExpired', params.isExpired.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.isTemplate !== undefined) queryParams.append('isTemplate', params.isTemplate.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/membership-cards/club/${clubId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async updateMembershipCard(cardId: string, data: UpdateMembershipCardRequest): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request(`/membership-cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateTemplateCardCustomization(membershipPlanId: string, customization: any, clubId?: string | null): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    const body: { membershipPlanId: string; customization: any; clubId?: string } = { membershipPlanId, customization };
    if (clubId) body.clubId = clubId;
    return this.request(`/membership-cards/template/customize`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async renewMembershipCard(cardId: string, data: RenewMembershipCardRequest): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request(`/membership-cards/${cardId}/renew`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateMembershipCard(cardId: string): Promise<ApiResponse<PublicMembershipCardDisplay>> {
    return this.request(`/membership-cards/${cardId}/deactivate`, {
      method: 'PATCH',
    });
  }

  async deleteMembershipCard(cardId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/membership-cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async regenerateQRCode(cardId: string): Promise<ApiResponse<{ qrCode: string }>> {
    return this.request(`/membership-cards/${cardId}/regenerate-qr`, {
      method: 'POST',
    });
  }

  async regenerateMyQRCode(): Promise<ApiResponse<{ qrCode: string }>> {
    return this.request(`/membership-cards/my-card/regenerate-qr`, {
      method: 'POST',
    });
  }

  async regenerateBarcode(cardId: string): Promise<ApiResponse<{ barcode: string }>> {
    return this.request(`/membership-cards/${cardId}/regenerate-barcode`, {
      method: 'POST',
    });
  }

  async getClubMembers(clubId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/clubs/${clubId}/members`);
  }

  async getPublicPolls(params?: {
    clubId?: string;
    page?: number;
    limit?: number;
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    search?: string;
  }): Promise<ApiResponse<{
    polls: Poll[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    return this.get('/polls/public', { params });
  }

  async getPolls(params?: {
    clubId?: string;
    page?: number;
    limit?: number;
    status?: 'draft' | 'active' | 'closed' | 'archived';
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    search?: string;
  }): Promise<ApiResponse<{
    polls: Poll[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.clubId) queryParams.append('clubId', params.clubId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/polls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getActivePolls(params?: {
    clubId?: string;
    page?: number;
    limit?: number;
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    search?: string;
  }): Promise<ApiResponse<{
    polls: Poll[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.clubId) queryParams.append('clubId', params.clubId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/polls/active${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getActivePollsByMyClub(params?: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'active' | 'closed' | 'archived';
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    search?: string;
  }): Promise<ApiResponse<{
    polls: Poll[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status) queryParams.append('status', params.status.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/polls/club${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getPollById(id: string): Promise<ApiResponse<Poll>> {
    return this.request(`/polls/${id}`);
  }

  async createPoll(data: {
    clubId?: string;
    question: string;
    description?: string;
    options: string[];
    allowMultipleVotes?: boolean;
    allowAnonymousVotes?: boolean;
    startDate?: string;
    endDate?: string;
    isPublic?: boolean;
    tags?: string;
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePoll(id: string, data: {
    question?: string;
    description?: string;
    options?: string[];
    allowMultipleVotes?: boolean;
    allowAnonymousVotes?: boolean;
    startDate?: string;
    endDate?: string;
    isPublic?: boolean;
    tags?: string;
    category?: 'general' | 'event' | 'feedback' | 'decision' | 'survey';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request(`/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePoll(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/polls/${id}`, {
      method: 'DELETE',
    });
  }

  async voteOnPoll(pollId: string, optionId: string): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  }

  async removeVoteFromPoll(pollId: string, optionId: string): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'DELETE',
      body: JSON.stringify({ optionId }),
    });
  }

  async changeVoteInPoll(pollId: string, oldOptionId: string, newOptionId: string): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'PUT',
      body: JSON.stringify({ oldOptionId, newOptionId }),
    });
  }

  async updatePollStatus(id: string, status: 'draft' | 'active' | 'closed' | 'archived'): Promise<ApiResponse<{ message: string; poll: Poll }>> {
    return this.request(`/polls/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getPollResults(id: string): Promise<ApiResponse<{
    poll: {
      _id: string;
      question: string;
      description?: string;
      status: string;
      totalVotes: number;
      totalVoters: number;
      allowMultipleVotes: boolean;
      allowAnonymousVotes: boolean;
      startDate?: string;
      endDate?: string;
      createdAt: string;
    };
    results: Array<{
      _id: string;
      text: string;
      votes: number;
      percentage: number;
      voters: Array<{
        _id: string;
        name: string;
        email: string;
        profile_picture?: string;
      }>;
    }>;
  }>> {
    return this.request(`/polls/${id}/results`);
  }

  async getPollStats(clubId?: string): Promise<ApiResponse<{
    stats: {
      total: number;
      active: number;
      closed: number;
      draft: number;
      archived: number;
      totalVotes: number;
      totalVoters: number;
    };
    categoryStats: { _id: string; count: number }[];
    priorityStats: { _id: string; count: number }[];
  }>> {
    const endpoint = clubId ? `/polls/stats?clubId=${clubId}` : '/polls/stats';
    return this.request(endpoint);
  }

  async getPublicChants(params: {
    clubId: string;
    fileType?: 'text' | 'image' | 'audio' | 'iframe';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    chants: Chant[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>> {
    return this.get('/chants/public', { params });
  }

  async getAllUserChants(params?: {
    fileType?: 'text' | 'image' | 'audio';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    chants: Chant[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.fileType) queryParams.append('fileType', params.fileType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/chants/user/all${query ? `?${query}` : ''}`);
  }

  async getChants(clubId: string, params?: {
    fileType?: 'text' | 'image' | 'audio' | 'iframe';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    chants: Chant[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.fileType) queryParams.append('fileType', params.fileType);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/chants/club/${clubId}${query ? `?${query}` : ''}`);
  }

  async getChantById(id: string): Promise<ApiResponse<Chant>> {
    return this.request(`/chants/${id}`);
  }

  async createChant(clubId: string, data: {
    title: string;
    description?: string;
    content?: string;
    fileType: 'text' | 'image' | 'audio' | 'iframe';
    tags?: string[];
    file?: File;
    iframeUrl?: string;
    iframeWidth?: string;
    iframeHeight?: string;
  }): Promise<ApiResponse<Chant>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.content) formData.append('content', data.content);
    formData.append('fileType', data.fileType);
    if (data.tags) formData.append('tags', data.tags.join(','));
    if (data.file) formData.append('file', data.file);
    if (data.iframeUrl) formData.append('iframeUrl', data.iframeUrl);
    if (data.iframeWidth) formData.append('iframeWidth', data.iframeWidth);
    if (data.iframeHeight) formData.append('iframeHeight', data.iframeHeight);

    return this.request(`/chants/club/${clubId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateChant(id: string, data: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
    file?: File;
    iframeUrl?: string;
    iframeWidth?: string;
    iframeHeight?: string;
  }): Promise<ApiResponse<Chant>> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.tags) formData.append('tags', data.tags.join(','));
    if (data.file) formData.append('file', data.file);
    if (data.iframeUrl !== undefined) formData.append('iframeUrl', data.iframeUrl);
    if (data.iframeWidth !== undefined) formData.append('iframeWidth', data.iframeWidth);
    if (data.iframeHeight !== undefined) formData.append('iframeHeight', data.iframeHeight);

    return this.request(`/chants/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteChant(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/chants/${id}`, {
      method: 'DELETE',
    });
  }

  async getChantStats(clubId: string): Promise<ApiResponse<{
    totalChants: number;
    totalSize: number;
    byType: {
      [key: string]: {
        count: number;
        totalSize: number;
      };
    };
  }>> {
    return this.request(`/chants/club/${clubId}/stats`);
  }

  async getMerchandise(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isAvailable?: boolean;
    clubId?: string;
  }): Promise<ApiResponse<{
    merchandise: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    return this.get('/merchandise/admin', { params });
  }

  async getMerchandiseById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/merchandise/admin/${id}`);
  }

  async createMerchandise(data: FormData): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.post('/merchandise/admin', data);
  }

  async updateMerchandise(id: string, data: FormData): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.put(`/merchandise/admin/${id}`, data);
  }

  async deleteMerchandise(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/merchandise/admin/${id}`);
  }

  async toggleMerchandiseAvailability(id: string): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.patch(`/merchandise/admin/${id}/toggle-availability`);
  }

  async getMerchandiseStats(params?: { clubId?: string }): Promise<ApiResponse<{
    totalMerchandise: number;
    availableMerchandise: number;
    featuredMerchandise: number;
    lowStockMerchandise: number;
    outOfStockMerchandise: number;
    categoryStats: Array<{
      _id: string;
      count: number;
    }>;
  }>> {
    return this.get('/merchandise/admin/stats', { params });
  }

  async getMerchandiseSettings(clubId?: string): Promise<ApiResponse<{
    clubId: string;
    clubName: string;
    settings: {
      shippingCost: number;
      freeShippingThreshold: number;
      taxRate: number;
      enableTax: boolean;
      enableShipping: boolean;
    };
  }>> {
    return this.get('/merchandise/admin/settings', { params: clubId ? { clubId } : undefined });
  }

  async updateMerchandiseSettings(settings: {
    shippingCost?: number;
    freeShippingThreshold?: number;
    taxRate?: number;
    enableTax?: boolean;
    enableShipping?: boolean;
  }, clubId?: string): Promise<ApiResponse<{
    clubId: string;
    clubName: string;
    settings: {
      shippingCost: number;
      freeShippingThreshold: number;
      taxRate: number;
      enableTax: boolean;
      enableShipping: boolean;
    };
  }>> {
    const result = await this.request<{
      clubId: string;
      clubName: string;
      settings: {
        shippingCost: number;
        freeShippingThreshold: number;
        taxRate: number;
        enableTax: boolean;
        enableShipping: boolean;
      };
    }>('/merchandise/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(clubId ? { ...settings, clubId } : settings),
    });
    return result;
  }

  async getPublicMerchandise(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    clubId?: string;
    featured?: boolean;
  }): Promise<ApiResponse<{
    merchandise: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    return this.get('/merchandise/public', { params });
  }

  async getPublicMerchandiseById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/merchandise/public/${id}`);
  }

  async getPublicMerchandiseSettings(clubId: string): Promise<ApiResponse<{
    clubId: string;
    clubName: string;
    settings: {
      shippingCost: number;
      freeShippingThreshold: number;
      taxRate: number;
      enableTax: boolean;
      enableShipping: boolean;
    };
  }>> {
    return this.get(`/merchandise/public/settings/${clubId}`);
  }

  async getClubSettings(clubId: string, isPublic: boolean = false): Promise<ApiResponse<any>> {
    const endpoint = isPublic ? `/club-settings/${clubId}/public` : `/club-settings/${clubId}`;
    
    if (isPublic) {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to fetch club settings'
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    }
    
    return this.get(endpoint);
  }

  async updateWebsiteSetup(clubId: string, data: {
    title: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    isPublished?: boolean;
    sections: {
      [key: string]: boolean;
    };
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/website-setup`, data);
  }

  async updateGroupListings(clubId: string, listings: Array<{
    name: string;
    description: string;
    contactInfo: string;
    members?: string[];
    memberCount?: number;
    isVisible: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/group-listings`, { listings });
  }

  async updateDesignSettings(clubId: string, data: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logo: string | null;
    motto: string;
    socialMedia: {
      facebook: string;
      twitter: string;
      instagram: string;
      youtube: string;
    };
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/design-settings`, data);
  }

  async updateAppSettings(clubId: string, data: {
    notifications: {
      events: boolean;
      membershipRenewals: boolean;
      membershipExpiry: boolean;
      newMerchandise: boolean;
      pollResults: boolean;
      newsUpdates: boolean;
    };
    appRules: string;
    maintenanceMode: boolean;
    openRegistration: boolean;
    publicEvents: boolean;
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/app-settings`, data);
  }

  async updateHelpSection(clubId: string, data: {
    faqs: Array<{
      question: string;
      answer: string;
      order: number;
    }>;
    contactInfo: {
      email: string;
      phone: string;
      supportHours: string;
    };
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/help-section`, data);
  }

  async getCoupons(): Promise<ApiResponse<{ coupons: any[] }>> {
    return this.request('/coupons');
  }

  async getActiveCoupons(): Promise<ApiResponse<{ coupons: any[] }>> {
    return this.request('/coupons/active');
  }

  async createCoupon(data: any): Promise<ApiResponse<{ message: string; coupon: any }>> {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoupon(id: string, data: any): Promise<ApiResponse<{ message: string; coupon: any }>> {
    return this.request(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/coupons/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleCouponStatus(id: string, isActive: boolean): Promise<ApiResponse<{ message: string; coupon: any }>> {
    return this.request(`/coupons/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async validateCoupon(code: string, eventId?: string, ticketPrice?: number): Promise<ApiResponse<{ coupon: { code: string; name: string; discountType: 'flat' | 'percentage'; discountValue: number; discount: number; originalPrice: number; finalPrice: number } }>> {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, eventId, ticketPrice }),
    });
  }

  async applyCoupon(code: string, eventId?: string, ticketPrice?: number): Promise<ApiResponse<{ message: string; discount: number; finalPrice: number }>> {
    return this.request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, eventId, ticketPrice }),
    });
  }

  async getCouponStats(id: string): Promise<ApiResponse<any>> {
    return this.request(`/coupons/${id}/stats`);
  }
  
  async getSystemStatus(): Promise<ApiResponse<{
    success: boolean;
    status: 'operational' | 'degraded' | 'down';
    timestamp: string;
    services: Array<{
      name: string;
      status: 'operational' | 'degraded' | 'down' | 'checking';
      message?: string;
      responseTime?: number;
    }>;
  }>> {
    return this.get('/system-status');
  }

  async validateMemberStatus(data: {
    clubId: string;
    email?: string;
    mobileNumber?: string;
    countryCode?: string;
  }): Promise<ApiResponse<{
    isMember: boolean;
    userId?: string;
    membershipStatus?: 'active' | 'expired' | 'cancelled' | 'pending';
    membershipEndDate?: string;
    message?: string;
  }>> {
    return this.request('/member-validation/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adjustMemberPoints(memberId: string, data: { points: number; reason?: string; mode?: 'add' | 'subtract'; clubId?: string }): Promise<ApiResponse<{ member: any; leaderboardEntry: any }>> {
    return this.request(`/users/members/${memberId}/points`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);