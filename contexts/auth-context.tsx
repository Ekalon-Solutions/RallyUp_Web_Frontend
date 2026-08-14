"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, Admin, SystemOwner, SESSION_EXPIRED_EVENT } from '../lib/api';
import { buildAccessibleClubs, reconcileActiveClubId } from '../lib/clubContext';
import { clearAllFeatureCaches } from '../lib/featureCacheStore';
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
  syncAuthSessionCookieFromStorage,
} from '../lib/auth-session-cookie';

interface AuthContextType {
  user: User | Admin | SystemOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isDashboardStaff: boolean;
  isSystemOwner: boolean;
  userRole: string | undefined;
  activeClubId: string | null;
  setActiveClubId: (clubId: string | null) => void;
  login: (email: string, phoneNumber: string, countryCode: string, isAdmin?: boolean, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  switchRole: (accountType: 'user' | 'admin' | 'system_owner', accountId: string, targetClubId?: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialActiveClubId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("activeClubId");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Admin | SystemOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(getInitialActiveClubId);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const ssoTicket = searchParams.get('ssoTicket');

        if (ssoTicket) {
          try {
            const res = await apiClient.ssoExchange(ssoTicket);
            if (res.success && res.data?.token) {
              localStorage.setItem('token', res.data.token);
              const role = res.data.user?.role;
              const uType = role === 'admin' || role === 'vendor' ? 'admin' : role === 'system_owner' ? 'system_owner' : 'user';
              localStorage.setItem('userType', uType);
              syncAuthSessionCookieFromStorage();
            }
          } catch (err) {
            console.error('Failed to exchange SSO ticket:', err);
          }
        } else {
          const urlToken = searchParams.get('token') || searchParams.get('authToken');
          if (urlToken) {
            localStorage.setItem('token', urlToken);
            localStorage.setItem('userType', 'user');
          }
        }

        const urlClubId = searchParams.get('clubId');
        if (urlClubId) {
          localStorage.setItem('activeClubId', urlClubId);
          window.sessionStorage.setItem('selectedClubId', urlClubId);
          setActiveClubIdState(urlClubId);
        }

        const isAppRedirectParam = searchParams.get('appRedirect') === 'true' || searchParams.has('appRedirect');
        if (isAppRedirectParam) {
          window.sessionStorage.setItem('appRedirect', 'true');
        }

        // Clean sensitive query parameters from browser address bar
        if (ssoTicket || searchParams.has('token') || searchParams.has('authToken') || searchParams.has('email') || searchParams.has('phone') || searchParams.has('appRedirect')) {
          searchParams.delete('ssoTicket');
          searchParams.delete('token');
          searchParams.delete('authToken');
          searchParams.delete('email');
          searchParams.delete('phone');
          searchParams.delete('appRedirect');
          const cleanQuery = searchParams.toString();
          const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

      const savedClubId = localStorage.getItem('activeClubId');
      syncAuthSessionCookieFromStorage();
      if (savedClubId && savedClubId !== activeClubId) {
        setActiveClubIdState(savedClubId);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('selectedClubId', savedClubId);
        }
      }
      if (isMounted) {
        checkAuth();
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'activeClubId') return;
      setActiveClubIdState(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!user) return;
    if ((user as any).role === 'system_owner') {
      // System owners only get activeClubId from localStorage (explicit sidebar selection)
      const existingClubId = localStorage.getItem('activeClubId');
      if (existingClubId && !activeClubId) {
        setActiveClubId(existingClubId);
      }
      return;
    }
    const existingClubId = localStorage.getItem('activeClubId');
    if (existingClubId) return; // already set – don't override an explicit selection
    const clubId = deriveActiveClubIdFromUser(user as any);
    if (clubId) {
      setActiveClubId(clubId);
    }
  }, [user]);

  const setActiveClubId = (clubId: string | null) => {
    setActiveClubIdState(clubId);
    if (clubId) {
      localStorage.setItem('activeClubId', clubId);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('selectedClubId', clubId);
      }
    } else {
      localStorage.removeItem('activeClubId');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('selectedClubId');
      }
    }
  };

  const deriveActiveClubIdFromUser = (u: any): string | null => {
    if (!u) return null;
    if (u?.club?._id) return u.club._id;
    if (typeof u?.club === 'string') return u.club;
    const clubs = Array.isArray(u?.clubs) ? u.clubs : [];
    if (clubs[0]) {
      const c = clubs[0];
      return (typeof c === 'object' && c?._id ? c._id : c) ?? null;
    }

    const memberships = Array.isArray(u?.memberships) ? u.memberships : [];
    const relevantMembership = memberships.find((m: any) => m?.status === 'active') || memberships.find((m: any) => m?.status === 'expired');
    const clubId = relevantMembership?.club_id?._id || relevantMembership?.club_id;
    return clubId || null;
  };

  const hydrateUserProfile = async (opts: {
    isAdmin: boolean;
    isSystemOwner: boolean;
    fallbackUserData: any;
  }): Promise<User | Admin | SystemOwner> => {
    const { isAdmin, isSystemOwner, fallbackUserData } = opts;

    try {
      let profileResponse:
        | Awaited<ReturnType<typeof apiClient.userProfile>>
        | Awaited<ReturnType<typeof apiClient.adminProfile>>
        | Awaited<ReturnType<typeof apiClient.systemOwnerProfile>>;

      if (isSystemOwner) {
        profileResponse = await apiClient.systemOwnerProfile();
      } else if (isAdmin) {
        profileResponse = await apiClient.adminProfile();
      } else {
        profileResponse = await apiClient.userProfile();
      }

      if (profileResponse?.success && profileResponse.data) {
        const profile = profileResponse.data as any;
        const accessible = buildAccessibleClubs(profile);
        const storedClubId =
          typeof window !== 'undefined' ? localStorage.getItem('activeClubId') : null;
        const reconciled = reconcileActiveClubId(storedClubId, accessible);
        if (reconciled) {
          setActiveClubId(reconciled);
        } else if (storedClubId && (isSystemOwner || isAdmin)) {
          // Preserve a previously stored selection even when accessible clubs are
          // empty (e.g. system_owner whose user profile lacks a clubs field).
          setActiveClubId(storedClubId);
        } else {
          const fallback = deriveActiveClubIdFromUser(profile);
          setActiveClubId(fallback);
        }
        return profile;
      }
    } catch {
    }

    const clubId = deriveActiveClubIdFromUser(fallbackUserData);
    if (clubId && !activeClubId) {
      setActiveClubId(clubId);
    }
    return fallbackUserData as any;
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      // console.log('Checking auth with token:', token ? 'exists' : 'missing', 'UserType:', userType);

      if (!token) {
        clearAuthSessionCookie();
        setIsLoading(false);
        return;
      }

      setAuthSessionCookie();

      let profileResponse = null;

      if (userType === 'admin' || userType === 'super_admin' || userType === 'vendor') {
        try {
          const adminResponse = await apiClient.adminProfile();
          if (adminResponse.success && adminResponse.data) {
            setUser(adminResponse.data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
        }
      } else if (userType === 'system_owner') {
        try {
          // console.log('Trying system owner profile (from userType)...');
          const systemOwnerResponse = await apiClient.systemOwnerProfile();
          if (systemOwnerResponse.success && systemOwnerResponse.data) {
            // console.log('Setting user from system owner profile:', systemOwnerResponse.data);
            setUser(systemOwnerResponse.data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // console.log('System owner profile failed, falling back to discovery');
        }
      } else if (userType === 'member' || userType === 'user' || userType === 'guest') {
        try {
          // console.log('Trying user profile (from userType)...');
          const userResponse = await apiClient.userProfile();
          if (userResponse.success && userResponse.data) {
            // console.log('Setting user from user profile:', userResponse.data);
            setUser(userResponse.data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // console.log('User profile failed, falling back to discovery');
        }
      }

      try {
        // console.log('Trying user profile (discovery)...');
        const userResponse = await apiClient.userProfile();
        if (userResponse.success && userResponse.data) {
          // console.log('Setting user from user profile:', userResponse.data);
          setUser(userResponse.data);
          localStorage.setItem('userType', 'member');
          setIsLoading(false);
          return;
        }
      } catch (error) {
      }
      try {
        // console.log('Trying admin profile (discovery)...');
        const adminResponse = await apiClient.adminProfile();
        if (adminResponse.success && adminResponse.data) {
          // console.log('Setting user from admin profile:', adminResponse.data);
          setUser(adminResponse.data);
          localStorage.setItem('userType', adminResponse.data.role);
          setIsLoading(false);
          return;
        }
      } catch (error) {
      }
      try {
        // console.log('Trying system owner profile (discovery)...');
        const systemOwnerResponse = await apiClient.systemOwnerProfile();
        if (systemOwnerResponse.success && systemOwnerResponse.data) {
          // console.log('Setting user from system owner profile:', systemOwnerResponse.data);
          setUser(systemOwnerResponse.data);
          localStorage.setItem('userType', 'system_owner');
          setIsLoading(false);
          return;
        }
      } catch (error) {
      }

      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      clearAuthSessionCookie();
      setUser(null);
    } catch (error) {
      // console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      clearAuthSessionCookie();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleRank = (role: string): number => {
    if (role === 'system_owner') return 1;
    if (role === 'super_admin') return 2;
    if (role === 'admin') return 3;
    if (role === 'vendor') return 4;
    return 5;
  };

  const login = async (email: string, phoneNumber: string, countryCode: string, isAdmin = false, isSystemOwner = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const loginData: any = {};
      if (email && email.trim()) {
        loginData.email = email.trim().toLowerCase();
      } else if (phoneNumber && phoneNumber.trim()) {
        loginData.phoneNumber = phoneNumber.trim();
        if (countryCode && countryCode.trim()) {
          loginData.countryCode = countryCode.trim();
        }
      } else {
        return { success: false, error: 'Please provide either email or phone number' };
      }

      let response: any = null;
      let effectiveIsSystemOwner = isSystemOwner;
      let effectiveIsAdmin = isAdmin;

      if (isSystemOwner) {
        response = await apiClient.systemOwnerLogin(loginData);
      } else if (isAdmin) {
        response = await apiClient.adminLogin(loginData);
      } else {
        // Unified login discovery — try system_owner -> admin -> user
        try {
          response = await apiClient.systemOwnerLogin(loginData);
          if (response?.success && response?.data) {
            effectiveIsSystemOwner = true;
          }
        } catch (_) {}

        if (!response?.success || !response?.data) {
          try {
            response = await apiClient.adminLogin(loginData);
            if (response?.success && response?.data) {
              effectiveIsAdmin = true;
            }
          } catch (_) {}
        }

        if (!response?.success || !response?.data) {
          response = await apiClient.userLogin(loginData);
        }
      }

      if (response && response.success && response.data) {
        localStorage.setItem('token', (response.data as any).token);
        setAuthSessionCookie();
        let userData: any;

        if (effectiveIsSystemOwner) {
          userData = (response.data as any).systemOwner || response.data;
          localStorage.setItem('userType', 'system_owner');
        } else if (effectiveIsAdmin) {
          userData = (response.data as any).admin || response.data;
          localStorage.setItem('userType', userData.role || 'admin');
        } else {
          userData = (response.data as any).user || response.data;
          localStorage.setItem('userType', userData?.role || 'member');
        }

        setUser(userData);
        clearAllFeatureCaches();
        let hydrated = await hydrateUserProfile({
          isAdmin: effectiveIsAdmin,
          isSystemOwner: effectiveIsSystemOwner,
          fallbackUserData: userData
        });
        setUser(hydrated);

        // Attempt highest-role account switch if higher role is linked
        try {
          const rolesRes = await apiClient.getAvailableRoles();
          if (rolesRes.success && rolesRes.data?.accounts && rolesRes.data.accounts.length > 0) {
            const accounts = [...rolesRes.data.accounts];
            accounts.sort((a: any, b: any) => getRoleRank(a.role) - getRoleRank(b.role));
            const highestAccount = accounts[0];
            const currentRole = (hydrated as any)?.role || localStorage.getItem('userType') || 'member';

            if (getRoleRank(highestAccount.role) < getRoleRank(currentRole)) {
              console.log(`Auto-switching login to highest role: ${highestAccount.role} (${highestAccount.accountId})`);
              const switchRes = await switchRole(highestAccount.accountType, highestAccount.accountId);
              if (switchRes.success) {
                return { success: true };
              }
            }
          }
        } catch (_) {}

        return { success: true };
      } else {
        const errorMessage = response?.error || response?.message ||
          (response?.errorDetails?.type === 'network_error'
            ? 'Connection failed. Please check your internet connection or try again later.'
            : 'Login failed. Please check your credentials and try again.');
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')
          ? 'Connection failed. Please check your internet connection or try again later.'
          : error.message)
        : 'An unexpected error occurred. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const switchRole = async (accountType: 'user' | 'admin' | 'system_owner', accountId: string, targetClubId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.switchAccountRole({ accountType, accountId });

      if (response.success && response.data) {
        const { token, accountType: switchedType, ...accountData } = response.data as any;
        localStorage.setItem('token', token);
        setAuthSessionCookie();

        const isAdmin = switchedType === 'admin';
        const isSystemOwner = switchedType === 'system_owner';

        if (isSystemOwner) {
          localStorage.setItem('userType', 'system_owner');
        } else if (isAdmin) {
          localStorage.setItem('userType', accountData.role || 'admin');
        } else {
          localStorage.setItem('userType', 'member');
        }

        // Reset active club so the newly active role derives its own primary club —
        // unless the caller is switching specifically to reach a known club, in which
        // case that explicit selection must survive the switch, not get wiped here.
        if (targetClubId) {
          localStorage.setItem('activeClubId', targetClubId);
        } else {
          localStorage.removeItem('activeClubId');
        }
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('selectedClubId');
        }

        clearAllFeatureCaches();

        const targetPath = isSystemOwner
          ? '/dashboard/club-management'
          : isAdmin
          ? '/dashboard'
          : '/dashboard/user';

        if (typeof window !== 'undefined') {
          window.location.href = targetPath;
        }

        return { success: true };
      }

      return { success: false, error: response.error || response.message || 'Unable to switch role' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: any, isSystemOwner = false): Promise<{ success: boolean; error?: string }> => {
    try {
      let response;
      if (isSystemOwner) {
        response = await apiClient.systemOwnerRegister(userData);
      } else {
        response = await apiClient.userRegister(userData);
      }

      if (response.success && response.data) {
        localStorage.setItem('token', (response.data as any).token);
        setAuthSessionCookie();
        let createdUserData;

        let userType: string;

        if (isSystemOwner) {
          createdUserData = (response.data as any).systemOwner || response.data;
          userType = 'system_owner';
        } else {
          createdUserData = (response.data as any).user || response.data;
          userType = 'member';
        }

        localStorage.setItem('userType', userType);

        setUser(createdUserData);
        const hydrated = await hydrateUserProfile({
          isAdmin: false,
          isSystemOwner,
          fallbackUserData: createdUserData
        });
        setUser(hydrated);
        return { success: true };
      } else {
        // console.error('Registration failed:', response.error);
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      // console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = () => {
    const isVendorUser = user?.role === 'vendor' || (user as any)?.isVendor;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('activeClubId');
    localStorage.removeItem('hasSeenDashboardLogo');
    localStorage.removeItem('hasSeenUserDashboardLogo');
    clearAuthSessionCookie();
    clearAllFeatureCaches();
    try {
      sessionStorage.removeItem('vendorScanSessionToken');
      sessionStorage.removeItem('vendorScanSessionMeta');
    } catch {}
    setUser(null);
    setActiveClubIdState(null);
    window.location.href = isVendorUser ? '/vendor/login' : '/';
  };

  useEffect(() => {
    const onSessionExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const updateProfile = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.updateUserProfile(data);
      if (response.success && response.data) {
        const raw = (response.data as any).user || response.data;

        setUser(prevUser => {
          if (!prevUser) return prevUser;
          const prev = prevUser as any;
          const name = raw.role === 'user'
            ? (raw.first_name != null && raw.last_name != null
              ? `${raw.first_name} ${raw.last_name}`.trim()
              : raw.name ?? prev.name)
            : (raw.name ?? prev.name);
          return {
            ...prevUser,
            name: name || prev.name,
            email: raw.email ?? prev.email,
            phoneNumber: raw.phoneNumber ?? prev.phoneNumber,
            countryCode: raw.countryCode ?? prev.countryCode,
            profilePicture: raw.profilePicture ?? prev.profilePicture,
            first_name: raw.first_name ?? prev.first_name,
            last_name: raw.last_name ?? prev.last_name,
            notificationPreferences: raw.notificationPreferences ?? prev.notificationPreferences,
            isPhoneVerified: raw.isPhoneVerified ?? prev.isPhoneVerified,
            address_line1: raw.address_line1 ?? prev.address_line1,
            address_line2: raw.address_line2 ?? prev.address_line2,
            city: raw.city ?? prev.city,
            state_province: raw.state_province ?? prev.state_province,
            zip_code: raw.zip_code ?? prev.zip_code,
            country: raw.country ?? prev.country,
          } as any;
        });

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner',
    isVendor: user?.role === 'vendor' || (user as Admin)?.isVendor === true,
    isDashboardStaff:
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.role === 'system_owner' ||
      user?.role === 'vendor' ||
      (user as Admin)?.isVendor === true,
    isSystemOwner: user?.role === 'system_owner',
    userRole: user?.role,
    activeClubId,
    setActiveClubId,
    login,
    switchRole,
    register,
    logout,
    updateProfile,
    checkAuth,
  };

  // console.log('Auth context value:', { user, isAdmin: user?.role === 'admin', userRole: user?.role });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
