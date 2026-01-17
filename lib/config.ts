const getApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5000/api';
};

const getWsBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  return 'ws://localhost:5000';
};

export const ENV = {
  CURRENT: 'production' as 'development' | 'production' | 'staging',
  
  development: {
    apiBaseUrl: getApiBaseUrl(),
    wsBaseUrl: getWsBaseUrl(),
    environment: 'development',
    debug: true,
  },
  
  production: {
    apiBaseUrl: 'https://wingmanpro.tech/api',
    wsBaseUrl: 'wss://teplworkspace.com/rallyApi',
    environment: 'production',
    debug: false,
  },
  
  staging: {
    apiBaseUrl: 'https://wingmanpro.tech/api',
    wsBaseUrl: 'wss://teplworkspace.com/rallyApi',
    environment: 'staging',
    debug: true,
  }
};

export const currentConfig = ENV[ENV.CURRENT];

export const API_ENDPOINTS = {
  users: {
    register: '/users/register',
    login: '/users/login',
    profile: '/users/profile',
    update: '/users/update',
    joinClubRequest: '/users/join-club-request',
    verifyPhone: '/users/verify-phone',
    resendOTP: '/users/resend-otp',
  },
  
  admin: {
    login: '/admin/login',
    profile: '/admin/profile',
    update: '/admin/update',
    verifyPhone: '/admin/verify-phone',
    resendOTP: '/admin/resend-otp',
  },
  
  systemOwner: {
    login: '/system-owner/login',
    create: '/system-owner/create',
    profile: '/system-owner/profile',
    update: '/system-owner/update',
    verifyPhone: '/system-owner/verify-phone',
    resendOTP: '/system-owner/resend-otp',
  },
  
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
  
  staff: {
    getAll: '/staff',
    getByClub: (clubId: string) => `/staff/club/${clubId}`,
    getStats: (clubId: string) => `/staff/club/${clubId}/stats`,
    create: '/staff/create',
    update: (clubId: string, staffId: string) => `/staff/club/${clubId}/${staffId}`,
    delete: (clubId: string, staffId: string) => `/staff/club/${clubId}/${staffId}`,
  },
  
  volunteer: {
    opportunities: '/volunteer/opportunities',
    signups: '/volunteer/signups',
    assign: '/volunteer/opportunities/assign',
    unassign: '/volunteer/opportunities/unassign',
    profile: '/volunteer/profile',
    update: '/volunteer/profile/update',
  },
  
  onboarding: {
    flows: '/onboarding/flows',
    userFlows: '/onboarding/user-flows',
    completeStep: '/onboarding/complete-step',
    progress: '/onboarding/progress',
    analytics: '/onboarding/analytics',
  },
  
  onboardingProgress: {
    myProgress: '/onboarding/progress/my-progress',
    myProgressForFlow: (flowId: string) => `/onboarding/progress/my-progress/${flowId}`,
    updateProgress: (flowId: string) => `/onboarding/progress/my-progress/${flowId}`,
    resetProgress: (flowId: string) => `/onboarding/progress/my-progress/${flowId}/reset`,
    allProgress: '/onboarding/progress/all-progress',
    flowStats: (flowId: string) => `/onboarding/progress/flow/${flowId}/stats`,
  },
  
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
  
  events: {
    create: '/events/create',
    update: '/events/update',
    delete: '/events/delete',
    getById: (id: string) => `/events/${id}`,
    getAll: '/events',
    publish: '/events/publish',
    unpublish: '/events/unpublish',
  },
  
  content: {
    news: '/content/news',
    announcements: '/content/announcements',
    pages: '/content/pages',
  },
  
  membership: {
    plans: '/membership/plans',
    subscribe: '/membership/subscribe',
    cancel: '/membership/cancel',
    history: '/membership/history',
  },
  
  systemStatus: {
    getStatus: '/system-status',
  },
  
  buildUrl: (endpoint: string) => `${currentConfig.apiBaseUrl}${endpoint}`,
  buildWsUrl: (endpoint: string) => `${currentConfig.wsBaseUrl}${endpoint}`,
};

export const getApiUrl = (endpoint: string) => `${currentConfig.apiBaseUrl}${endpoint}`;

export const getWsUrl = (endpoint: string) => `${currentConfig.wsBaseUrl}${endpoint}`;

export const getBaseUrl = () => currentConfig.apiBaseUrl.replace('/api', '');

export const getNewsImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '';
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${getBaseUrl()}/uploads/news/${imagePath}`;
};

export const isDevelopment = () => ENV.CURRENT === 'development';
export const isProduction = () => ENV.CURRENT === 'production';
export const isStaging = () => ENV.CURRENT === 'staging';

export const debugLog = (message: string, data?: any) => {
  if (currentConfig.debug) {
    // console.log(`[${ENV.CURRENT.toUpperCase()}] ${message}`, data || '');
  }
};

export default currentConfig;
