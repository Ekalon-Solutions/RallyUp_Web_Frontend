"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, Admin, SystemOwner } from '../lib/api';

interface AuthContextType {
  user: User | Admin | SystemOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSystemOwner: boolean;
  userRole: string | undefined;
  activeClubId: string | null;
  setActiveClubId: (clubId: string | null) => void;
  login: (email: string, phoneNumber: string, countryCode: string, isAdmin?: boolean, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any, isAdmin?: boolean, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Admin | SystemOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const savedClubId = localStorage.getItem('activeClubId');
    if (savedClubId) {
      setActiveClubIdState(savedClubId);
    }
    checkAuth();
  }, []);

  const setActiveClubId = (clubId: string | null) => {
    setActiveClubIdState(clubId);
    if (clubId) {
      localStorage.setItem('activeClubId', clubId);
    } else {
      localStorage.removeItem('activeClubId');
    }
  };

  const deriveActiveClubIdFromUser = (u: any): string | null => {
    if (!u) return null;
    if (u?.club?._id) return u.club._id;
    if (typeof u?.club === 'string') return u.club;

    const memberships = Array.isArray(u?.memberships) ? u.memberships : [];
    const activeMembership = memberships.find((m: any) => m?.status === 'active');
    const clubId = activeMembership?.club_id?._id || activeMembership?.club_id;
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
        const clubId = deriveActiveClubIdFromUser(profileResponse.data as any);
        if (clubId && !activeClubId) {
          setActiveClubId(clubId);
        }
        return profileResponse.data as any;
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
        setIsLoading(false);
        return;
      }

      let profileResponse = null;
      
      if (userType === 'admin') {
        try {
          // console.log('Trying admin profile (from userType)...');
          const adminResponse = await apiClient.adminProfile();
          if (adminResponse.success && adminResponse.data) {
            // console.log('Setting user from admin profile:', adminResponse.data);
            setUser(adminResponse.data);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          // console.log('Admin profile failed, falling back to discovery');
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
      } else if (userType === 'member' || userType === 'user') {
        // Try user profile first
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
        // Silently continue to next check
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
      setUser(null);
    } catch (error) {
      // console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phoneNumber: string, countryCode: string, isAdmin = false, isSystemOwner = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const loginData: any = {};
      if (email && email.trim()) {
        loginData.email = email.trim();
      } else if (phoneNumber && phoneNumber.trim()) {
        loginData.phoneNumber = phoneNumber.trim();
        if (countryCode && countryCode.trim()) {
          loginData.countryCode = countryCode.trim();
        }
      } else {
        return { success: false, error: 'Please provide either email or phone number' };
      }

      let response;
      if (isSystemOwner) {
        response = await apiClient.systemOwnerLogin(loginData);
      } else if (isAdmin) {
        response = await apiClient.adminLogin(loginData);
      } else {
        response = await apiClient.userLogin(loginData);
      }

      if (response.success && response.data) {
        localStorage.setItem('token', (response.data as any).token);
        let userData: any;
        
        if (isSystemOwner) {
          userData = (response.data as any).systemOwner || response.data;
          localStorage.setItem('userType', 'system_owner');
        } else if (isAdmin) {
          userData = (response.data as any).admin || response.data;
          localStorage.setItem('userType', userData.role);
        } else {
          userData = (response.data as any).user || response.data;
          localStorage.setItem('userType', 'member');
        }
        
        setUser(userData);
        const hydrated = await hydrateUserProfile({
          isAdmin,
          isSystemOwner,
          fallbackUserData: userData
        });
        setUser(hydrated);
        return { success: true };
      } else {
        const errorMessage = response.error || response.message || 
          (response.errorDetails?.type === 'network_error' 
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

  const register = async (userData: any, isAdmin = false, isSystemOwner = false): Promise<{ success: boolean; error?: string }> => {
    try {
      let response;
      if (isSystemOwner) {
        response = await apiClient.systemOwnerRegister(userData);
      } else if (isAdmin) {
        response = await apiClient.adminRegister(userData);
      } else {
        response = await apiClient.userRegister(userData);
      }

      if (response.success && response.data) {
        localStorage.setItem('token', (response.data as any).token);
        let createdUserData;
        
        let userType: string;
        
        if (isSystemOwner) {
          createdUserData = (response.data as any).systemOwner || response.data;
          userType = 'system_owner';
        } else if (isAdmin) {
          createdUserData = (response.data as any).admin || response.data;
          userType = createdUserData.role;
        } else {
          createdUserData = (response.data as any).user || response.data;
          userType = 'member';
        }
        
        localStorage.setItem('userType', userType);
        
        setUser(createdUserData);
        const hydrated = await hydrateUserProfile({
          isAdmin,
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
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('activeClubId');
    localStorage.removeItem('hasSeenDashboardLogo');
    setUser(null);
    setActiveClubIdState(null);
    window.location.href = '/';
  };

  const updateProfile = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.updateUserProfile(data);
      if (response.success && response.data) {
        const updatedUser = (response.data as any).user || response.data;
        
        setUser(prevUser => ({
          ...prevUser,
          ...updatedUser,
          name: updatedUser.role==='user' ? (updatedUser.first_name && updatedUser.last_name
            ? `${updatedUser.first_name} ${updatedUser.last_name}`.trim()
            : prevUser?.name || '') : updatedUser.name || prevUser?.name,
          phoneNumber: updatedUser.phoneNumber || prevUser?.phoneNumber || '',
          countryCode: updatedUser.phone_country_code || prevUser?.countryCode || '+1',
        } as any));
        
        return { success: true };
      } else {
        // console.error('Profile update failed:', response.error);
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      // console.error('Profile update error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'system_owner',
    isSystemOwner: user?.role === 'system_owner',
    userRole: user?.role,
    activeClubId,
    setActiveClubId,
    login,
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