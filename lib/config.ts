// Environment Configuration
export const ENV = {
  // Change this to switch between environments
  CURRENT: 'development' as 'development' | 'production' | 'staging',
  
  // Development environment (localhost)
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    wsBaseUrl: 'ws://localhost:5000',
    environment: 'development',
    debug: true,
  },
  
  // Production environment (deployment)
  production: {
    apiBaseUrl: 'http://3.111.169.32:5050/api',
    wsBaseUrl: 'ws://3.111.169.32:5050',
    environment: 'production',
    debug: false,
  },
  
  // Staging environment (if needed)
  staging: {
    apiBaseUrl: 'http://3.111.169.32:5050/api',
    wsBaseUrl: 'ws://3.111.169.32:5050',
    environment: 'staging',
    debug: true,
  }
};

// Get current environment config
export const currentConfig = ENV[ENV.CURRENT];

// API Endpoints - All endpoints will use the base URL from config
export const API_ENDPOINTS = {
  // User endpoints
  users: {
    register: '/users/register',
    login: '/users/login',
    profile: '/users/profile',
    update: '/users/update',
    joinClubRequest: '/users/join-club-request',
    verifyPhone: '/users/verify-phone',
    resendOTP: '/users/resend-otp',
  },
  
  // Admin endpoints
  admin: {
    login: '/admin/login',
    profile: '/admin/profile',
    update: '/admin/update',
    verifyPhone: '/admin/verify-phone',
    resendOTP: '/admin/resend-otp',
  },
  
  // System Owner endpoints
  systemOwner: {
    login: '/system-owner/login',
    create: '/system-owner/create',
    profile: '/system-owner/profile',
    update: '/system-owner/update',
    verifyPhone: '/system-owner/verify-phone',
    resendOTP: '/system-owner/resend-otp',
  },
  
  // Club endpoints
  clubs: {
    public: '/clubs/public',
    create: '/clubs/create',
    update: '/clubs/update',
    delete: '/clubs/delete',
    getById: (id: string) => `/clubs/${id}`,
    getBySlug: (slug: string) => `/clubs/slug/${slug}`,
    joinRequest: '/clubs/join-request',
    leave: '/clubs/leave',
  },
  
  // Staff endpoints
  staff: {
    getAll: '/staff',
    getByClub: (clubId: string) => `/staff/club/${clubId}`,
    getStats: (clubId: string) => `/staff/club/${clubId}/stats`,
    create: '/staff/create',
    update: (clubId: string, staffId: string) => `/staff/club/${clubId}/${staffId}`,
    delete: (clubId: string, staffId: string) => `/staff/club/${clubId}/${staffId}`,
  },
  
  // Volunteer endpoints
  volunteer: {
    opportunities: '/volunteer/opportunities',
    signups: '/volunteer/signups',
    assign: '/volunteer/opportunities/assign',
    unassign: '/volunteer/opportunities/unassign',
    profile: '/volunteer/profile',
    update: '/volunteer/profile/update',
  },
  
  // Onboarding endpoints
  onboarding: {
    flows: '/onboarding/flows',
    userFlows: '/onboarding/user-flows',
    completeStep: '/onboarding/complete-step',
    progress: '/onboarding/progress',
    analytics: '/onboarding/analytics',
  },
  
  // User Onboarding Progress endpoints
  onboardingProgress: {
    myProgress: '/onboarding/progress/my-progress',
    myProgressForFlow: (flowId: string) => `/onboarding/progress/my-progress/${flowId}`,
    updateProgress: (flowId: string) => `/onboarding/progress/my-progress/${flowId}`,
    resetProgress: (flowId: string) => `/onboarding/progress/my-progress/${flowId}/reset`,
    allProgress: '/onboarding/progress/all-progress',
    flowStats: (flowId: string) => `/onboarding/progress/flow/${flowId}/stats`,
  },
  
  // Promotional content endpoints
  promotions: {
    getAll: '/promotions',
    active: '/promotions/active',
    getById: (id: string) => `/promotions/${id}`,
    club: '/promotions/club',
    create: '/promotions',
    update: (id: string) => `/promotions/${id}`,
    delete: (id: string) => `/promotions/${id}`,
    status: (id: string) => `/promotions/${id}/status`,
    view: (id: string) => `/promotions/${id}/view`,
    click: (id: string) => `/promotions/${id}/click`,
    conversion: (id: string) => `/promotions/${id}/conversion`,
  },
  
  // Event endpoints
  events: {
    create: '/events/create',
    update: '/events/update',
    delete: '/events/delete',
    getById: (id: string) => `/events/${id}`,
    getAll: '/events',
    publish: '/events/publish',
    unpublish: '/events/unpublish',
  },
  
  // Content endpoints
  content: {
    news: '/content/news',
    announcements: '/content/announcements',
    pages: '/content/pages',
  },
  
  // Membership endpoints
  membership: {
    plans: '/membership/plans',
    subscribe: '/membership/subscribe',
    cancel: '/membership/cancel',
    history: '/membership/history',
  },
  
  // Utility functions to build full URLs
  buildUrl: (endpoint: string) => `${currentConfig.apiBaseUrl}${endpoint}`,
  buildWsUrl: (endpoint: string) => `${currentConfig.wsBaseUrl}${endpoint}`,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => `${currentConfig.apiBaseUrl}${endpoint}`;

// Helper function to get full WebSocket URL
export const getWsUrl = (endpoint: string) => `${currentConfig.wsBaseUrl}${endpoint}`;

// Environment detection helpers
export const isDevelopment = () => ENV.CURRENT === 'development';
export const isProduction = () => ENV.CURRENT === 'production';
export const isStaging = () => ENV.CURRENT === 'staging';

// Debug logging (only in development/staging)
export const debugLog = (message: string, data?: any) => {
  if (currentConfig.debug) {
    console.log(`[${ENV.CURRENT.toUpperCase()}] ${message}`, data || '');
  }
};

// Export current config for easy access
export default currentConfig;
