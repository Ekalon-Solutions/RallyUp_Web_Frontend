import { getApiUrl } from './config';
import { triggerBlobDownload } from './utils';
import { patchEventResponseData } from './eventDisplayAdjustments';
import { CLUB_FEATURE_DISABLED_EVENT, type ClubFeatureKey } from './clubFeatures';

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
  adminTitle?: string;
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

export interface AlbumMediaItem {
  _id: string;
  url: string;
  key: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Album {
  _id: string;
  clubId: string;
  name: string;
  description?: string;
  folderPath?: string;
  coverImage?: string;
  coverImageKey?: string;
  coverImageSetManually: boolean;
  mediaItems: AlbumMediaItem[];
  totalSize: number;
  createdBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StorageAlertLevel = 'warning' | 'danger' | 'critical' | 'exceeded';

export interface StorageAlertStatus {
  usagePercent: number;
  usedGb: number;
  totalGb: number;
  alertLevel: StorageAlertLevel | null;
  hasCancelledSubscription: boolean;
  overageGb: number;
  showUpgradeModal: boolean;
}

export interface GalleryStorageSummary {
  clubId: string;
  albumsCount: number;
  usage: {
    usedBytes: number;
    totalBytes: number;
    availableBytes: number;
    usedGb: number;
    totalGb: number;
    availableGb: number;
  };
  upgrades: Array<{
    _id: string;
    plan: 'monthly' | 'annual' | 'quarterly';
    storageGb: number;
    additionalBytes: number;
    amount: number;
    currency: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    isActive: boolean;
  }>;
  pricing: {
    monthly: { amountInr: number; additionalGb: number };
    annual: { amountInr: number; additionalGb: number; discountLabel: string };
    quarterly?: { amountInr: number; additionalGb: number };
  };
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

export interface VenueClubAllocation {
  clubName: string;
  allocation: number;
  sold: number;
}

export interface VenueTier {
  _id: string;
  name: string;
  price: number;
  allocation: number;
  sold: number;
  clubAllocations?: VenueClubAllocation[];
}

export interface EventVenue {
  _id: string;
  name: string;
  tiers: VenueTier[];
}

export interface VenueTierCartItem {
  venueId: string;
  tierId: string;
  quantity: number;
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
    venueItems?: Array<{
      venueId: string;
      venueName: string;
      tierId: string;
      tierName: string;
      quantity: number;
      price: number;
    }>;
  }>;
  currentAttendees: number;
  earlyBirdDiscount?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
    startTime: string,
    endTime: string,
    membersOnly?: boolean,
  }
  attendancePoints?: number;
  waitlist?: {
    enabled: boolean;
    percentage: number;
    purchaseWindowHours: number;
  }
  jointScreening?: {
    enabled: boolean;
    homeTeam?: string;
    awayTeam?: string;
    partnerClubNames?: string[];
  };
  venues?: EventVenue[];
  currency?: string;
  isRefundAllowed?: boolean;
  is_refund_allowed?: boolean;
  refundCutoffHours?: number;
  refund_cutoff_hours?: number;
  refundPolicyLastUpdated?: string;
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
    flexible: boolean;
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
  duration?: number;
  planStartDate?: string;
  planEndDate?: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
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
  referralReward?: {
    enabled: boolean;
    points: number;
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
  adminComment?: string;
  status: 'fulfilled' | 'rejected' | 'on_hold' | 'pending' | 'cancelled_by_member' | 'unfulfilled';
  fixture_id?: Event | string;
  competition?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalTicketFixture {
  _id: string;
  title: string;
  startTime: string;
  competition: string;
  isVisibleForMembers: boolean;
  visibilityEndsAt?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeamBadge?: string | null;
  awayTeamBadge?: string | null;
  externalEventId?: string | null;
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

        if (
          typeof window !== 'undefined' &&
          data?.code === 'FEATURE_DISABLED_BY_SYSTEM' &&
          data?.feature
        ) {
          window.dispatchEvent(
            new CustomEvent(CLUB_FEATURE_DISABLED_EVENT, {
              detail: {
                feature: data.feature as ClubFeatureKey,
                message: data.message || errorMessage,
              },
            })
          );
        }

        return {
          success: false,
          error: errorMessage,
          message: data.message,
          data,
          errorDetails,
          status: response.status
        };
      }

      const patchedData = patchEventResponseData(endpoint, data) as T;

      return {
        success: true,
        data: patchedData,
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

  async adminLogAttendance(data: { registrationId?: string | null; attendeeId?: string | null; }): Promise<ApiResponse<any>> {
    return this.request('/events/admin/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScanPreview(registrationId: string, attendeeId: string): Promise<ApiResponse<{
    attendeeName: string;
    attendeePhone: string;
    attended: boolean;
    assignedVenueName?: string;
    assignedTierName?: string;
    eventTitle: string;
    eventVenue: string;
    eventId: string;
    registrationId: string;
    attendeeId: string;
    venueItems: Array<{ venueId: string; venueName: string; tierId: string; tierName: string; quantity: number; price: number }>;
  }>> {
    const params = new URLSearchParams({ registrationId, attendeeId });
    const res = await this.request<any>(`/events/scan-preview?${params.toString()}`);
    if (!res.success) return res;
    return { success: true, data: res.data?.data ?? res.data };
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

  async sendOtp(data: {
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    role: 'user' | 'admin' | 'system_owner';
    username?: string;
    recaptchaToken?: string;
  }): Promise<ApiResponse<{ userData?: any; sessionInfo?: string }>> {
    return this.request('/otp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmailOTP(params: { email: string; otp: string; role: 'user' | 'admin' | 'system_owner' }): Promise<ApiResponse<{ token: string } & (User | Admin | SystemOwner)>> {
    return this.request('/otp/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async verifyOTP(params: { 
    phoneNumber?: string; 
    countryCode?: string; 
    email?: string; 
    otp: string; 
    role: 'user' | 'admin' | 'system_owner';
    sessionInfo?: string;
  }): Promise<ApiResponse<{ verified: boolean; token?: string; channel?: string }>> {
    return this.request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async resendOTP(data: {
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    role: 'user' | 'admin' | 'system_owner';
    username?: string;
    recaptchaToken?: string;
    channel?: 'whatsapp' | 'sms';
  }): Promise<ApiResponse<{ userData?: any; sessionInfo?: string; deliveryChannel?: string; whatsAppUsed?: boolean }>> {
    return this.request('/otp/resend', {
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
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    zip_code?: string;
    country?: string;
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

    if (data.address_line1 !== undefined) backendData.address_line1 = data.address_line1;
    if (data.address_line2 !== undefined) backendData.address_line2 = data.address_line2;
    if (data.city !== undefined) backendData.city = data.city;
    if (data.state_province !== undefined) backendData.state_province = data.state_province;
    if (data.zip_code !== undefined) backendData.zip_code = data.zip_code;
    if (data.country !== undefined) backendData.country = data.country;

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

  async getClubEventRegistrations(clubId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = clubId ? `/events/club/registrations?clubId=${encodeURIComponent(clubId)}` : '/events/club/registrations';
    const res = await this.request<{ data?: any[]; success?: boolean } | any[]>(endpoint);
    if (!res.success || res.data == null) return res as ApiResponse<any[]>;
    const list = Array.isArray(res.data) ? res.data : (res.data as { data?: any[] }).data;
    return { ...res, data: Array.isArray(list) ? list : [] };
  }

  async resendEventTicketWhatsApp(registrationId: string): Promise<
    ApiResponse<{
      message: string;
      whatsapp?: {
        messageCount?: number;
        sentCount?: number;
        failedCount?: number;
        attendees?: Array<{ attendeeName: string; phone: string; ok: boolean; error?: string }>;
      };
    }>
  > {
    const res = await this.request<{
      success?: boolean;
      message?: string;
      whatsapp?: {
        messageCount?: number;
        sentCount?: number;
        failedCount?: number;
        attendees?: Array<{ attendeeName: string; phone: string; ok: boolean; error?: string }>;
      };
    }>(`/events/club/registrations/${encodeURIComponent(registrationId)}/resend-ticket`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!res.success || res.data == null) return res as ApiResponse<{ message: string }>;
    const body = res.data;
    const message =
      body.message ||
      (body.whatsapp?.sentCount
        ? `WhatsApp ticket sent (${body.whatsapp.sentCount} message${body.whatsapp.sentCount === 1 ? '' : 's'})`
        : 'WhatsApp ticket sent');
    return {
      success: body.success !== false && (body.whatsapp?.sentCount ?? 0) > 0,
      message,
      data: { message, whatsapp: body.whatsapp },
      error: res.error,
    };
  }

  async resendEventTicketEmail(registrationId: string, overrideEmail?: string): Promise<ApiResponse<{ message: string }>> {
    return this.resendEventTicketWhatsApp(registrationId);
  }

  async cancelClubEventRegistration(
    registrationId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string; data?: { eventTitle?: string; seatsReleased?: number } }>> {
    return this.request(`/events/club/registrations/${encodeURIComponent(registrationId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    });
  }

  async getPublicEvents(clubId?: string): Promise<ApiResponse<Event[]>> {
    const endpoint = clubId ? `/events/public?clubId=${clubId}` : '/events/public';
    return this.request(endpoint);
  }

  async getPublicEventById(id: string): Promise<ApiResponse<Event>> {
    return this.request(`/events/public/${id}`);
  }

  async checkEventRegistration(eventId: string): Promise<ApiResponse<{
    isRegistered: boolean;
    registrationStatus?: string;
    isMember: boolean;
    canRegisterMultiple: boolean;
    registrationId?: string;
  }>> {
    return this.request(`/events/public/${eventId}/check-registration`);
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
    fixtureId?: string;
    competition?: string;
  }): Promise<ApiResponse<ExternalTicketRequest>> {
    return this.request('/external-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listAvailableExternalTicketFixtures(clubId: string, params?: { competition?: string }): Promise<ApiResponse<ExternalTicketFixture[]>> {
    const query: Record<string, any> = {};
    if (params?.competition) query.competition = params.competition;
    return this.request<ExternalTicketFixture[]>(
      `/external-tickets/club/${clubId}/fixtures` +
      (Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : '')
    );
  }

  async proxyInternalNextMatches(params: { team?: string; teamId?: string; clubId?: string; leagueId?: string } = {}): Promise<ApiResponse<any>> {
    const query: Record<string, string> = {};
    if (params.team) query.team = params.team;
    if (params.teamId) query.teamId = params.teamId;
    if (params.leagueId) query.leagueId = params.leagueId;
    const qs = Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
    return this.request<any>(`/sports/next-matches${qs}`);
  }

  async listExternalTicketFixturesForAdmin(clubId: string, params?: { competition?: string }) {
    const query: Record<string, any> = {};
    if (params?.competition) query.competition = params.competition;
    return this.request<ExternalTicketFixture[]>(
      `/external-tickets/club/${clubId}/fixtures/admin` +
      (Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : '')
    );
  }

  async bulkUpdateExternalTicketFixtureVisibility(
    clubId: string,
    payload: { fixtureIds: string[]; enabled: boolean; visibilityEndsAt?: string | null }
  ) {
    return this.request<{ matchedCount: number; modifiedCount: number }>(
      `/external-tickets/club/${clubId}/fixtures/visibility`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
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

  async updateExternalTicketRequestStatus(
    id: string,
    status: 'fulfilled' | 'rejected' | 'on_hold' | 'pending' | 'cancelled_by_member' | 'unfulfilled',
    adminComment?: string
  ) {
    return this.request(`/external-tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminComment }),
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

  async listMyExternalTicketRequests() {
    return this.request<ExternalTicketRequest[]>('/external-tickets/my-requests');
  }

  async respondToRescheduledExternalTicketRequest(
    id: string,
    payload: { action: 'accept' | 'reject'; comment?: string }
  ) {
    return this.request<ExternalTicketRequest>(`/external-tickets/${id}/reschedule-response`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    currency?: string;
    requiresTicket: boolean;
    memberOnly: boolean;
    clubId?: string;
    awayDayEvent?: boolean;
    bookingStartTime?: string;
    bookingEndTime?: string;
    attendancePoints?: number;
    earlyBirdDiscount?: any;
    memberDiscount?: any;
    groupDiscount?: any;
    waitlist?: { enabled: boolean; percentage?: number; purchaseWindowHours?: number };
    venues?: Array<{ name: string; tiers: Array<{ name: string; price: number; allocation: number; clubAllocations?: Array<{ clubName: string; allocation: number }> }> }>;
    jointScreening?: { enabled: boolean; homeTeam?: string; awayTeam?: string; partnerClubNames?: string[] };
    isRefundAllowed?: boolean;
    is_refund_allowed?: boolean;
    refundCutoffHours?: number;
    refund_cutoff_hours?: number;
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
    currency?: string;
    requiresTicket?: boolean;
    memberOnly?: boolean;
    clubId?: string;
    awayDayEvent?: boolean;
    bookingStartTime?: string;
    bookingEndTime?: string;
    attendancePoints?: number;
    waitlist?: { enabled?: boolean; percentage?: number; purchaseWindowHours?: number };
    venues?: Array<{ name: string; tiers: Array<{ name: string; price: number; allocation: number; clubAllocations?: Array<{ clubName: string; allocation: number }> }> }>;
    jointScreening?: { enabled: boolean; homeTeam?: string; awayTeam?: string; partnerClubNames?: string[] };
    isRefundAllowed?: boolean;
    is_refund_allowed?: boolean;
    refundCutoffHours?: number;
    refund_cutoff_hours?: number;
    refund_policy_change_reason?: string;
    reason?: string;
    acknowledgeLivePolicyImpact?: boolean;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getRedemptionSettings(): Promise<ApiResponse<{ settings: any; onePointValue: number }>> {
    return this.request('/redemption/admin');
  }

  async updateRedemptionSettings(data: any): Promise<ApiResponse<{ settings: any; onePointValue: number }>> {
    return this.request('/redemption/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMemberRedemption(memberId: string): Promise<ApiResponse<{ settings: any; onePointValue: number; batches: any[] }>> {
    return this.request(`/redemption/members/${memberId}`);
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

  async registerForEvent(eventId: string, notes?: string, attendees?: Array<{ name: string; phone: string }>, couponCode?: string | null, orderID?: string, paymentID?: string, signature?: string, waitlistToken?: string, reservationToken?: string, amountPaid?: number, couponDiscount?: number, earlyBirdDiscountAmt?: number, pointsDiscount?: number, attributed_club?: string): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ notes, attendees, couponCode, orderID, paymentID, signature, waitlistToken, reservationToken, amountPaid, couponDiscount, earlyBirdDiscountAmt, pointsDiscount, attributed_club }),
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
    reservationToken?: string;
    amountPaid?: number;
    couponDiscount?: number;
    earlyBirdDiscountAmt?: number;
    pointsDiscount?: number;
    attributed_club?: string;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/public/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPendingRegistration(eventId: string, data: {
    attendees?: Array<{ name: string; phone: string }>;
    couponCode?: string | null;
    razorpayOrderId: string;
    amountPaid: number;
    waitlistToken?: string;
    reservationToken?: string;
    couponDiscount?: number;
    earlyBirdDiscountAmt?: number;
    pointsDiscount?: number;
    attributed_club?: string;
  }): Promise<ApiResponse<{ pendingRegistrationId?: string }>> {
    return this.request(`/events/${eventId}/register/pending`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPendingPublicRegistration(eventId: string, data: {
    registrantName: string;
    registrantEmail?: string;
    registrantPhone?: string;
    attendees?: Array<{ name: string; phone: string }>;
    couponCode?: string | null;
    razorpayOrderId: string;
    amountPaid: number;
    reservationToken?: string;
    couponDiscount?: number;
    earlyBirdDiscountAmt?: number;
    pointsDiscount?: number;
    attributed_club?: string;
  }): Promise<ApiResponse<{ pendingRegistrationId?: string }>> {
    return this.request(`/events/public/${eventId}/register/pending`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRevenueReconciliation(clubId?: string, attributed_club?: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (clubId) params.set('clubId', clubId);
    if (attributed_club) params.set('attributed_club', attributed_club);
    const qs = params.toString();
    return this.request(`/events/revenue-reconciliation${qs ? `?${qs}` : ''}`);
  }

  async getEventRefundLog(params: {
    clubId: string;
    policyFilter?: 'all' | 'refundable' | 'non_refundable';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    rows: Array<Record<string, unknown>>;
    pagination: { page: number; limit: number; totalItems: number; totalPages: number };
    summary: {
      totalTickets: number;
      totalRevenue: number;
      totalSavings: number;
      blockedAttemptCount: number;
      manualOverrideCount: number;
    };
  }>> {
    const qs = new URLSearchParams();
    qs.set('clubId', params.clubId);
    if (params.policyFilter && params.policyFilter !== 'all') qs.set('policyFilter', params.policyFilter);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return this.request(`/refunds/admin/event-refund-log?${qs.toString()}`);
  }

  async downloadEventRefundLogCsv(params: {
    clubId: string;
    policyFilter?: 'all' | 'refundable' | 'non_refundable';
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const qs = new URLSearchParams();
      qs.set('clubId', params.clubId);
      if (params.policyFilter && params.policyFilter !== 'all') qs.set('policyFilter', params.policyFilter);
      const result = await this.downloadFile(`/refunds/admin/event-refund-log/export?${qs.toString()}`);
      if (!result.success || !result.blob) {
        return { success: false, error: result.error ?? 'Export failed' };
      }
      triggerBlobDownload(result.blob, result.filename ?? 'event-refund-log.csv');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message ?? 'Export failed' };
    }
  }

  async bookVenueTierMatrix(eventId: string, data: {
    items: VenueTierCartItem[];
    attendees?: Array<{ name: string; phone: string }>;
    razorpayOrderId?: string;
    paymentId?: string;
    amountPaid?: number;
    reservationToken?: string;
    couponCode?: string;
    couponDiscount?: number;
    earlyBirdDiscountAmt?: number;
    pointsDiscount?: number;
    attributed_club?: string;
  }): Promise<ApiResponse<{ message: string; event: Event }>> {
    return this.request(`/events/${eventId}/book-matrix`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPendingVenueTierBooking(eventId: string, data: {
    items: VenueTierCartItem[];
    attendees?: Array<{ name: string; phone: string }>;
    razorpayOrderId: string;
    amountPaid: number;
    reservationToken?: string;
    couponCode?: string;
    couponDiscount?: number;
    earlyBirdDiscountAmt?: number;
    pointsDiscount?: number;
    attributed_club?: string;
  }): Promise<ApiResponse<{ registrationId: string }>> {
    return this.request(`/events/${eventId}/book-matrix/pending`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createReservation(points: number, clubId: string, orderTotal?: number): Promise<ApiResponse<{ reservationToken: string; discountAmount?: number }>> {
    const body: any = { points, clubId };
    if (orderTotal !== undefined) body.orderTotal = Number(orderTotal);
    return this.request('/points/reservations/create', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async confirmReservation(reservationToken: string, orderId?: string): Promise<ApiResponse> {
    return this.request('/points/reservations/confirm', {
      method: 'POST',
      body: JSON.stringify({ reservationToken, orderId }),
    })
  }

  async cancelReservation(reservationToken: string): Promise<ApiResponse> {
    return this.request('/points/reservations/cancel', {
      method: 'POST',
      body: JSON.stringify({ reservationToken }),
    })
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
    const res = await this.request<{ registration?: any; success?: boolean }>(
      `/events/registration/${registrationId}`
    );
    if (!res.success || !res.data) return res as ApiResponse<{ registration: any }>;
    const registration = res.data.registration ?? (res.data as any).registration;
    return { ...res, data: { registration } };
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

  async getLeaderboard(clubId?: string): Promise<ApiResponse<{
    leaderboard: Array<{
      userId: string;
      username?: string;
      name?: string;
      email?: string;
      avatar?: string;
      club?: string;
      eventCount: number;
      points: number;
    }>;
  }>> {
    const params = clubId ? new URLSearchParams({ clubId }) : undefined;
    const url = params ? `/leaderboard?${params.toString()}` : '/leaderboard';
    return this.request(url);
  }

  async updateLeaderboardPoints(userId: string, points: number, clubId?: string): Promise<ApiResponse<any>> {
    return this.request(`/leaderboard/${encodeURIComponent(userId)}/points`, {
      method: 'PATCH',
      body: JSON.stringify({ points, ...(clubId ? { clubId } : {}) }),
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
      flexible: boolean;
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
      flexible?: boolean;
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

  async updatePendingOrderPayment(orderId: string, data: {
    couponCode?: string;
    clearCoupon?: boolean;
    reservationToken?: string | null;
    redeemedPoints?: number;
    redeemedDiscount?: number;
    finalAmount?: number;
    platformFee?: number;
    platformFeeGst?: number;
    razorpayFee?: number;
    razorpayFeeGst?: number;
  }): Promise<ApiResponse<any>> {
    return this.request(`/orders/my-orders/${orderId}/update-payment`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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

  async createMembershipPlan(data: {
    name: string;
    description: string;
    price: number;
    currency: string;
    planStartDate?: string;
    planEndDate?: string;
    bookingStartDate?: string;
    bookingEndDate?: string;
    duration?: number;
    features: any;
    referralReward?: {
      enabled: boolean;
      points: number;
    };
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

  async hardDeleteMembershipPlan(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/membership-plans/${id}/permanent`, {
      method: 'DELETE',
    });
  }

  async assignMembershipPlan(planId: string, userId: string): Promise<ApiResponse<{ message: string; user: User }>> {
    return this.request(`/membership-plans/${planId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getActiveMembersPerPlan(clubId: string): Promise<ApiResponse<Record<string, number>>> {
    return this.request(`/user-memberships/active-per-plan?clubId=${encodeURIComponent(clubId)}`);
  }

  async checkReferralPhone(
    phone: string,
    options?: { clubId?: string; refereePhone?: string }
  ): Promise<ApiResponse<{
    exists: boolean;
    isSelf?: boolean;
    isMember?: boolean;
    name?: string;
  }>> {
    const params = new URLSearchParams({ phone });
    if (options?.clubId) params.set('clubId', options.clubId);
    if (options?.refereePhone) params.set('refereePhone', options.refereePhone);
    const res = await this.request(`/membership-plans/referral-check?${params.toString()}`);
    if (res.success && res.data) {
      return { ...res, data: (res.data as any).exists !== undefined ? res.data : (res.data as any) };
    }
    return res;
  }

  async subscribeMembershipPlan(
    planId: string,
    payment?: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string },
    referralPhone?: string
  ): Promise<ApiResponse<{
    message: string;
    data: {
      userMembership: any;
      isUpgrade: boolean;
    }
  }>> {
    const body: any = {};
    if (payment) body.payment = payment;
    if (referralPhone) body.referralPhone = referralPhone;
    return this.request(`/membership-plans/${planId}/subscribe`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
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

  async getMemberElevationContext(clubId: string): Promise<ApiResponse<{
    club: { _id: string; name: string };
    isPrimaryOwner: boolean;
    startingRoles: Array<{ value: string; label: string }>;
    quota: { current: number; max: number | null; atLimit: boolean };
  }>> {
    return this.request(`/member-elevation/${encodeURIComponent(clubId)}/context`);
  }

  async searchMembersForElevation(
    clubId: string,
    q: string,
    limit = 20
  ): Promise<ApiResponse<{
    members: Array<{
      _id: string;
      name: string;
      email?: string;
      phoneNumber?: string;
      countryCode?: string;
      profilePicture?: string;
      membershipStatus: string;
      isActive: boolean;
      isAlreadyAdmin: boolean;
      canElevate: boolean;
      elevateDisabledReason: string | null;
    }>;
  }>> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.request(`/member-elevation/${encodeURIComponent(clubId)}/search?${params}`);
  }

  async elevateMemberToAdmin(
    clubId: string,
    data: { userId: string; startingRole: string; acknowledged: boolean }
  ): Promise<ApiResponse<{
    message: string;
    admin: { _id: string; name: string; email: string; role: string; adminTitle?: string; startingRoleLabel?: string };
    member: { _id: string; isAlreadyAdmin: boolean; canElevate: boolean };
  }>> {
    return this.request(`/member-elevation/${encodeURIComponent(clubId)}/elevate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClubAdminRoster(clubId: string): Promise<ApiResponse<{
    club: { _id: string; name: string };
    admins: Array<{
      adminId: string;
      name: string;
      email: string;
      adminTier: string;
      roleLabel: string;
      isOwner: boolean;
      canRevoke: boolean;
      profilePicture?: string;
      invitationEmail?: {
        status: string;
        sentAt?: string;
        label: string;
      } | null;
    }>;
    bouncedInvitations?: Array<{
      adminId: string;
      email: string;
      bouncedAt?: string;
    }>;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/admins`
    );
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async checkDemoteAdmin(
    clubId: string,
    adminId: string
  ): Promise<ApiResponse<{
    requiresReplacement: boolean;
    isLastClubAdmin: boolean;
    blockingVenues: Array<{
      eventId: string;
      eventTitle: string;
      venueId: string;
      venueName: string;
    }>;
    eligibleReplacements: Array<{
      adminId: string;
      name: string;
      email: string;
      adminTier: string;
    }>;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/demote-check?adminId=${encodeURIComponent(adminId)}`
    );
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async demoteAdminFromClub(
    clubId: string,
    data: {
      adminId: string;
      reason: string;
      replacementAdminId?: string;
    }
  ): Promise<ApiResponse<{
    message: string;
    accessTokenInvalidated: boolean;
    sessionsTerminated: number;
    globalLogout: boolean;
  }>> {
    return this.request(`/member-elevation/${encodeURIComponent(clubId)}/demote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateAdminInvitation(token: string): Promise<ApiResponse<{
    clubId: string;
    adminId: string;
    email: string;
    roleLabel: string;
    moduleSummary: string[];
    needsEmailVerification: boolean;
    status: string;
  }>> {
    const res = await this.request<any>('/admin-invitations/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async acceptAdminInvitation(token: string): Promise<ApiResponse<{
    clubId: string;
    redirectUrl: string;
    needsEmailVerification: boolean;
    email: string;
  }>> {
    const res = await this.request<any>('/admin-invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async resendAdminInvitationEmail(
    clubId: string,
    adminId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request(
      `/member-elevation/${encodeURIComponent(clubId)}/admins/${encodeURIComponent(adminId)}/resend-invitation`,
      { method: 'POST' }
    );
  }

  async getPermissionMatrix(clubId: string): Promise<ApiResponse<{
    club: { _id: string; name: string };
    modules: Array<{ id: string; label: string; category: string; navHref?: string }>;
    categories: string[];
    admins: Array<{
      adminId: string;
      name: string;
      email: string;
      adminTier: string;
      isOwner: boolean;
      isLocked: boolean;
      permissionsMatrix: Record<string, { view: boolean; edit: boolean }>;
    }>;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/permission-matrix`
    );
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async patchPermissionMatrix(
    clubId: string,
    data: {
      adminId: string;
      moduleId?: string;
      accessType?: 'view' | 'edit';
      value?: boolean;
      confirmFinanceReporting?: boolean;
    }
  ): Promise<ApiResponse<{
    saved: boolean;
    permissionsMatrix: Record<string, { view: boolean; edit: boolean }>;
    sessionsTerminated?: number;
    code?: string;
    requiresConfirmation?: boolean;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/permission-matrix`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return res;
  }

  async patchPermissionMatrixCategory(
    clubId: string,
    data: {
      adminId: string;
      category: string;
      accessType: 'view' | 'edit';
      value: boolean;
      confirmFinanceReporting?: boolean;
    }
  ): Promise<ApiResponse<{
    saved: boolean;
    permissionsMatrix: Record<string, { view: boolean; edit: boolean }>;
    code?: string;
    requiresConfirmation?: boolean;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/permission-matrix/category`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    if (!res.success && res.data) {
      return { ...res, data: res.data };
    }
    return res;
  }

  async getPermissionMatrixPreview(
    clubId: string,
    adminId: string
  ): Promise<ApiResponse<{
    admin: { _id: string; name: string; email: string };
    permissionsMatrix: Record<string, { view: boolean; edit: boolean }>;
    visibleModules: Array<{
      moduleId: string;
      label: string;
      href?: string;
      canEdit: boolean;
      category: string;
    }>;
    hiddenCount: number;
  }>> {
    const res = await this.request<any>(
      `/member-elevation/${encodeURIComponent(clubId)}/permission-matrix/${encodeURIComponent(adminId)}/preview`
    );
    if (res.success && res.data) {
      return { ...res, data: res.data.data ?? res.data };
    }
    return res;
  }

  async getClubAdminActivityLog(
    clubId: string,
    params?: { page?: number; limit?: number; action?: string }
  ): Promise<ApiResponse<{
    entries: Array<{
      _id: string;
      actorId: string;
      actorName?: string;
      actorType: string;
      targetId?: string;
      targetType?: string;
      action: string;
      oldState: string;
      newState: string;
      summary?: string;
      riskLevel: 'low' | 'medium' | 'high';
      permissionSnapshotAtAction?: Record<string, unknown>;
      relatedEntityId?: string;
      relatedEntityType?: string;
      ipAddress: string;
      deviceInfo?: { userAgent?: string; deviceType?: string };
      metadata?: Record<string, unknown>;
      timestamp: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.action) search.set('action', params.action);
    const qs = search.toString();
    return this.request(
      `/member-elevation/${encodeURIComponent(clubId)}/activity-log${qs ? `?${qs}` : ''}`
    );
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

  async getClubFeatureMatrix(search?: string): Promise<ApiResponse<{
    featureKeys: string[];
    labels: Record<string, string>;
    tooltips: Record<string, string>;
    clubs: Array<{
      clubId: string;
      name: string;
      slug: string;
      status: string;
      billing_tier: string;
      billing_status: string;
      flags: Array<{ key: string; enabled: boolean; state: string; label: string }>;
      estimated_monthly_usd: number;
    }>;
  }>> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/club-features/matrix${q}`);
  }

  async patchClubFeatures(
    clubId: string,
    body: {
      updates?: Record<string, { enabled: boolean; state?: string }>;
      billing_tier?: string;
      billing_status?: string;
      feature_constraints?: Record<string, number>;
      reasonCode?: string;
    }
  ): Promise<ApiResponse<unknown>> {
    return this.request(`/club-features/club/${clubId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async bulkApplyClubBillingTier(
    clubIds: string[],
    tier: string,
    reasonCode?: string
  ): Promise<ApiResponse<{ updated: number; tier: string }>> {
    return this.request('/club-features/bulk-tier', {
      method: 'POST',
      body: JSON.stringify({ clubIds, tier, reasonCode }),
    });
  }

  async getClubFeatureAuditLog(params?: {
    clubId?: string;
    actorId?: string;
    limit?: number;
  }): Promise<ApiResponse<unknown[]>> {
    const sp = new URLSearchParams();
    if (params?.clubId) sp.set('clubId', params.clubId);
    if (params?.actorId) sp.set('actorId', params.actorId);
    if (params?.limit) sp.set('limit', String(params.limit));
    const q = sp.toString() ? `?${sp}` : '';
    return this.request(`/club-features/audit${q}`);
  }

  async getMyClubFeatures(clubId: string): Promise<ApiResponse<import('./clubFeatures').ResolvedClubFeatures>> {
    return this.request(`/club-features/my-club?clubId=${encodeURIComponent(clubId)}`);
  }

  async submitFeatureUpgradeInquiry(body: {
    clubId: string;
    featureKey: string;
    message?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/club-features/upgrade-inquiry', {
      method: 'POST',
      body: JSON.stringify(body),
    });
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

  async migrateMemberPlan(data: { userId: string; clubId: string; newPlanId: string }): Promise<ApiResponse<{ message: string; membership: unknown; previousMembershipId?: string }>> {
    return this.request('/user-memberships/migrate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async bulkMigrateMemberPlan(data: { clubId: string; newPlanId: string; userIds: string[] }): Promise<ApiResponse<{ message: string; migrated: number; total: number; failed: number; errors?: string[] }>> {
    return this.request('/user-memberships/migrate-bulk', {
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
    export?: boolean;
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
    if (params?.export) queryParams.append('export', 'true');

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

  async getShiprocketShippingRate(params: {
    pickupPostcode: number;
    deliveryPostcode: number;
    weight: number;
    declaredValue: number;
    cod?: boolean;
  }): Promise<ApiResponse<{ data?: unknown }>> {
    return this.request<{ data?: unknown }>('/merchandise/shipping-rate', {
      method: 'POST',
      body: JSON.stringify({
        pickupPostcode: params.pickupPostcode,
        deliveryPostcode: params.deliveryPostcode,
        weight: params.weight,
        declaredValue: params.declaredValue,
        cod: params.cod !== false,
      }),
    });
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
    sections?: {
      [key: string]: boolean;
    };
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/website-setup`, data);
  }

  async updateMemberSectionVisibility(clubId: string, data: {
    sections: { [key: string]: boolean };
  }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/member-section-visibility`, data);
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
    heroImage?: string | null;
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

  async searchSportsTeams(clubId: string, q: string): Promise<ApiResponse<any[]>> {
    return this.get(`/club-settings/${clubId}/sports/search`, { params: { q } });
  }

  async updateClubSportsSettings(clubId: string, data: { teamName?: string; teamId?: string; teamBadge?: string; teamLogo?: string }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/sports`, data);
  }

  async refreshLeagueTables(): Promise<ApiResponse<any>> {
    return this.post(`/sports/refresh-league-tables`, {});
  }

  async getLeagueTable(leagueId: string): Promise<ApiResponse<any>> {
    return this.get(`/sports/league-table`, { params: { leagueId } });
  }

  async getClubAddress(clubId: string): Promise<ApiResponse<{ street?: string; city?: string; state?: string; country?: string; zipCode?: string }>> {
    return this.get(`/club-settings/${clubId}/address`);
  }

  async updateClubAddress(clubId: string, address: { street?: string; city?: string; state?: string; country?: string; zipCode?: string }): Promise<ApiResponse<any>> {
    return this.put(`/club-settings/${clubId}/address`, address);
  }

  async getCoupons(clubId: string): Promise<ApiResponse<{ coupons: any[] }>> {
    return this.get('/coupons', { params: { clubId } });
  }

  async getActiveCoupons(): Promise<ApiResponse<{ coupons: any[] }>> {
    return this.request('/coupons/active');
  }

  async createCoupon(data: { clubId: string;[key: string]: any }): Promise<ApiResponse<{ message: string; coupon: any }>> {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  private couponUrl(id: string, clubId?: string): string {
    const base = `/coupons/${id}`;
    return clubId ? `${base}?clubId=${encodeURIComponent(clubId)}` : base;
  }

  async updateCoupon(id: string, data: any, clubId?: string): Promise<ApiResponse<{ message: string; coupon: any }>> {
    return this.request(this.couponUrl(id, clubId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(id: string, clubId?: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(this.couponUrl(id, clubId), {
      method: 'DELETE',
    });
  }

  async toggleCouponStatus(id: string, isActive: boolean, clubId?: string): Promise<ApiResponse<{ message: string; coupon: any }>> {
    const path = `/coupons/${id}/toggle` + (clubId ? `?clubId=${encodeURIComponent(clubId)}` : '');
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async validateCoupon(code: string, eventId?: string, ticketPrice?: number, clubId?: string): Promise<ApiResponse<{ coupon: { code: string; name: string; discountType: 'flat' | 'percentage'; discountValue: number; discount: number; originalPrice: number; finalPrice: number } }>> {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, eventId, ticketPrice, clubId }),
    });
  }

  async applyCoupon(code: string, eventId?: string, ticketPrice?: number, clubId?: string): Promise<ApiResponse<{ message: string; discount: number; finalPrice: number }>> {
    return this.request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ code, eventId, ticketPrice, clubId }),
    });
  }

  async getCouponStats(id: string, clubId?: string): Promise<ApiResponse<any>> {
    return this.get(`/coupons/${id}/stats`, { params: clubId ? { clubId } : undefined });
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

  async estimateRefund(data: {
    sourceType: 'event_ticket' | 'store_order';
    eventId?: string;
    orderId?: string;
  }): Promise<ApiResponse<{
    ok: boolean;
    eligible: boolean;
    cutoff: string | null;
    estimatedRefund: number;
    currency: string;
    breakdown: {
      grossPaid: number;
      taxesExcluded: number;
      platformFeesExcluded: number;
      paymentGatewayFeesExcluded: number;
    };
  }>> {
    return this.request('/refunds/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestRefund(data: {
    sourceType: 'event_ticket' | 'store_order';
    eventId?: string;
    orderId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/refunds/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listRefundsAdmin(params?: {
    page?: number;
    limit?: number;
    status?: string;
    clubId?: string;
  }): Promise<ApiResponse<{
    refunds: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    return this.get('/refunds/admin', { params });
  }

  async getRefundRecalculate(refundId: string): Promise<ApiResponse<{
    recalculatedRefund: number;
    percentage: number;
    breakdown: any;
    originalRefund: number;
    differs: boolean;
  }>> {
    return this.get(`/refunds/admin/${refundId}/recalculate`);
  }

  async markRefundProcessed(refundId: string, adminNotes?: string): Promise<ApiResponse<any>> {
    return this.request(`/refunds/admin/${refundId}/processed`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNotes }),
    });
  }

  async getEventRefundPolicy(eventId: string): Promise<ApiResponse<{
    eventId: string;
    clubId: string;
    clubName: string;
    eventTitle: string;
    eventStartTime?: string;
    refundable: boolean;
    is_refund_allowed: boolean;
    grandfathered_purchase?: boolean;
    refund_window_closed?: boolean;
    event_cancelled?: boolean;
    policySummaryLine?: string;
    currentRefundPercentage: number;
    hoursRemainingToCancel: number | null;
    cancelCutoffAt: string | null;
    policyText: string;
    usesStandardTemplate: boolean;
    rules: Array<{ daysBefore: number; refundPercentage: number }>;
    platformTermsUrl: string;
  }>> {
    return this.request(`/refunds/policy/event/${encodeURIComponent(eventId)}`);
  }

  async trackRefundPolicyModalOpen(data: {
    eventId?: string;
    clubId: string;
    source?: 'badge' | 'checkout' | 'event_detail' | 'other';
    context?: 'checkout' | 'browse';
  }): Promise<ApiResponse<void>> {
    return this.request('/refunds/policy/track-open', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRefundPolicyModalAnalytics(params: {
    clubId: string;
    days?: number;
  }): Promise<ApiResponse<{
    periodDays: number;
    totalOpens: number;
    topEvents: Array<{ eventId: string; count: number; eventTitle?: string }>;
    bySource: Array<{ source: string; count: number }>;
    dailyOpens: Array<{ date: string; count: number }>;
  }>> {
    return this.get('/refunds/admin/policy-analytics', { params });
  }

  async getClubStats(clubId: string): Promise<ApiResponse<{
    totalMembers: number;
    activeMembers: number;
    verifiedMembers: number;
    newMembersThisMonth: number;
    inactiveMembers: number;
    unverifiedMembers: number;
  }>> {
    return this.request(`/clubs/${clubId}/stats`);
  }

  async getOrderStats(): Promise<ApiResponse<{
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  }>> {
    return this.request('/orders/admin/stats');
  }

  async getPublicGalleryAlbums(clubId: string): Promise<ApiResponse<{ albums: Album[] }>> {
    return this.request(`/gallery/public?clubId=${encodeURIComponent(clubId)}`);
  }

  async getMemberAlbums(clubId?: string): Promise<ApiResponse<{ albums: Album[] }>> {
    const endpoint = clubId ? `/gallery/member/albums?clubId=${encodeURIComponent(clubId)}` : '/gallery/member/albums';
    return this.request(endpoint);
  }

  async getMemberAlbumById(albumId: string): Promise<ApiResponse<{ album: Album }>> {
    return this.request(`/gallery/member/albums/${albumId}`);
  }

  async getAdminAlbums(clubId?: string): Promise<ApiResponse<{ albums: Album[] }>> {
    const endpoint = clubId ? `/gallery/albums?clubId=${encodeURIComponent(clubId)}` : '/gallery/albums';
    return this.request(endpoint);
  }

  async createAlbum(data: { name: string; description?: string; folderName?: string; clubId?: string }): Promise<ApiResponse<{ album: Album }>> {
    return this.request('/gallery/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async notifyGalleryUploadSession(
    albumId: string,
    sessionId: string
  ): Promise<ApiResponse<{ message: string; skipped?: boolean }>> {
    return this.request(`/gallery/albums/${albumId}/notify-upload`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async deleteAlbum(albumId: string): Promise<ApiResponse<{ message: string; deleteErrors: string[] }>> {
    return this.request(`/gallery/albums/${albumId}`, { method: 'DELETE' });
  }

  async deleteMediaItem(albumId: string, mediaItemId: string): Promise<ApiResponse<{ album: Album }>> {
    return this.request(`/gallery/albums/${albumId}/media/${mediaItemId}`, { method: 'DELETE' });
  }

  async setAlbumCoverImage(albumId: string, mediaItemId?: string): Promise<ApiResponse<{ album: Album }>> {
    return this.request(`/gallery/albums/${albumId}/cover`, {
      method: 'PATCH',
      body: JSON.stringify({ mediaItemId }),
    });
  }

  async getGalleryStorageSummary(clubId?: string): Promise<ApiResponse<GalleryStorageSummary>> {
    const endpoint = clubId ? `/gallery/storage/summary?clubId=${encodeURIComponent(clubId)}` : '/gallery/storage/summary';
    return this.request(endpoint);
  }

  async getStorageAlertStatus(clubId?: string): Promise<ApiResponse<StorageAlertStatus>> {
    const endpoint = clubId ? `/gallery/storage/alert-status?clubId=${encodeURIComponent(clubId)}` : '/gallery/storage/alert-status';
    return this.request(endpoint);
  }

  async upgradeGalleryStorage(data: {
    plan: 'monthly' | 'annual' | 'quarterly';
    storageGb: number;
    autoRenew?: boolean;
    clubId?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/gallery/storage/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getGTSPreferences(clubId: string): Promise<ApiResponse<{
    hasAcceptedConsent: boolean;
    isInClubLeague: boolean;
    isInGlobalLeague: boolean;
    hasOptedOutGlobalLeagueSeason: boolean;
    season: string;
  }>> {
    return this.request(`/gts/preferences?clubId=${encodeURIComponent(clubId)}`);
  }

  async acceptGTSConsent(data: { clubId: string; joinClubLeague: boolean; joinGlobalLeague: boolean }): Promise<ApiResponse<any>> {
    return this.post('/gts/consent', data);
  }

  async optInGlobalLeague(clubId: string): Promise<ApiResponse<any>> {
    return this.post('/gts/global-league/opt-in', { clubId });
  }

  async optOutGlobalLeague(clubId: string): Promise<ApiResponse<any>> {
    return this.post('/gts/global-league/opt-out', { clubId });
  }

  async getGTSFixtures(clubId: string): Promise<ApiResponse<{
    fixtures: Array<{
      idEvent: string;
      strEvent: string;
      strHomeTeam: string;
      strAwayTeam: string;
      strHomeTeamBadge?: string;
      strAwayTeamBadge?: string;
      dateEvent: string;
      strTime: string;
      strTimestamp?: string;
      intHomeScore: string | null;
      intAwayScore: string | null;
      strStatus: string;
      idLeague?: string;
      strLeague?: string;
    }>;
  }>> {
    return this.request(`/gts/fixtures?clubId=${encodeURIComponent(clubId)}`);
  }

  async submitGTSPrediction(data: {
    fixtureId: string;
    strTime: string;
    dateEvent: string;
    homeScore: number;
    awayScore: number;
    clubId: string;
    homeTeam: string;
    awayTeam: string;
  }): Promise<ApiResponse<{
    _id: string;
    fixtureId: string;
    homeScore: number;
    awayScore: number;
    lockedAt: string;
  }>> {
    return this.post('/gts/predictions', data);
  }

  async getMyGTSPredictions(clubId: string, season?: string): Promise<ApiResponse<{
    predictions: Array<{
      _id: string;
      fixtureId: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
      matchDate: string;
      lockedAt?: string;
      pointsEarned?: number | null;
      result?: 'exact' | 'close' | 'correct_outcome' | 'incorrect' | null;
    }>;
  }>> {
    const qs = new URLSearchParams({ clubId, ...(season ? { season } : {}) });
    return this.request(`/gts/predictions/me?${qs.toString()}`);
  }

  async getGTSLeaderboard(params: { clubId: string; type: 'club' | 'global'; season?: string }): Promise<ApiResponse<{
    leaderboard: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      clubName: string;
      points: number;
      rank: number;
    }>;
    userRank?: number;
    userPoints?: number;
  }>> {
    const qs = new URLSearchParams({ clubId: params.clubId, type: params.type, ...(params.season ? { season: params.season } : {}) });
    return this.request(`/gts/leaderboard?${qs.toString()}`);
  }

  async calculateGTSPoints(fixtureId: string, clubId: string): Promise<ApiResponse<any>> {
    return this.post('/gts/calculate', { fixtureId, clubId });
  }

  async listNotificationTemplates(clubId: string): Promise<
    ApiResponse<{
      templates: any[];
      mappingOverview: Record<string, any[]>;
      variables: Array<{ key: string; placeholder: string; sample: string }>;
      charLimits: Record<string, { subject?: number; body: number }>;
      triggerLabels: Record<string, string>;
    }>
  > {
    const res = await this.get(`/clubs/${clubId}/notification-templates`);
    if (res.success && res.data) {
      return { ...res, data: (res.data as any).data ?? res.data };
    }
    return res;
  }

  async getNotificationTemplate(clubId: string, templateId: string): Promise<ApiResponse<any>> {
    const res = await this.get(`/clubs/${clubId}/notification-templates/${templateId}`);
    if (res.success && res.data) {
      return { ...res, data: (res.data as any).data ?? res.data };
    }
    return res;
  }

  async updateNotificationTemplate(
    clubId: string,
    templateId: string,
    data: { subject?: string; body: string; suppressionEnabled?: boolean }
  ): Promise<ApiResponse<any> & { undoSnapshot?: any; validation?: any }> {
    const res = await this.put(`/clubs/${clubId}/notification-templates/${templateId}`, data);
    if (res.success && res.data) {
      const body = res.data as any;
      return {
        ...res,
        data: body.data ?? body,
        undoSnapshot: body.undoSnapshot,
        validation: body.validation,
      };
    }
    return res;
  }

  async resetNotificationTemplate(
    clubId: string,
    templateId: string
  ): Promise<ApiResponse<any> & { undoSnapshot?: any }> {
    const res = await this.post(`/clubs/${clubId}/notification-templates/${templateId}/reset`, {});
    if (res.success && res.data) {
      const body = res.data as any;
      return {
        ...res,
        data: body.data ?? body,
        undoSnapshot: body.undoSnapshot,
      };
    }
    return res;
  }

  async undoResetNotificationTemplate(
    clubId: string,
    templateId: string,
    undoSnapshot: Record<string, unknown>
  ): Promise<ApiResponse<any>> {
    const res = await this.post(`/clubs/${clubId}/notification-templates/${templateId}/undo-reset`, { undoSnapshot });
    if (res.success && res.data) {
      return { ...res, data: (res.data as any).data ?? res.data };
    }
    return res;
  }

  async globalResetNotificationTemplates(
    clubId: string
  ): Promise<ApiResponse<{ resetCount: number; templates: any[] }>> {
    const res = await this.post(`/clubs/${clubId}/notification-templates/global-reset`, {});
    if (res.success && res.data) {
      return { ...res, data: (res.data as any).data ?? res.data };
    }
    return res;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);