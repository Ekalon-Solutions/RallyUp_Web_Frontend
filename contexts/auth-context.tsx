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
  login: (email: string, phoneNumber: string, countryCode: string, isAdmin?: boolean, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any, isAdmin?: boolean, isSystemOwner?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Admin | SystemOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Checking auth with token:', token ? 'exists' : 'missing');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Store the user type in localStorage during login to know which collection to check
      const userType = localStorage.getItem('userType');
      console.log('Checking auth for user type:', userType);

      if (userType === 'system_owner') {
        try {
          const systemOwnerResponse = await apiClient.systemOwnerProfile();
          console.log('System owner profile response:', systemOwnerResponse);
          if (systemOwnerResponse.success && systemOwnerResponse.data) {
            console.log('Setting user from system owner profile:', systemOwnerResponse.data);
            setUser(systemOwnerResponse.data);
            setIsLoading(false);
            return;
          } else {
            console.log('System owner profile response failed:', systemOwnerResponse);
          }
        } catch (error) {
          console.log('System owner profile check failed:', error);
        }
      } else if (userType === 'admin' || userType === 'super_admin') {
        try {
          const adminResponse = await apiClient.adminProfile();
          console.log('Admin profile response:', adminResponse);
          if (adminResponse.success && adminResponse.data) {
            console.log('Setting user from admin profile:', adminResponse.data);
            setUser(adminResponse.data);
            setIsLoading(false);
            return;
          } else {
            console.log('Admin profile response failed:', adminResponse);
          }
        } catch (error) {
          console.log('Admin profile check failed:', error);
        }
      } else {
        // Default to user profile for members or unknown types
        try {
          const userResponse = await apiClient.userProfile();
          console.log('User profile response:', userResponse);
          if (userResponse.success && userResponse.data) {
            console.log('Setting user from user profile:', userResponse.data);
            setUser(userResponse.data);
            setIsLoading(false);
            return;
          } else {
            console.log('User profile response failed:', userResponse);
          }
        } catch (error) {
          console.log('User profile check failed:', error);
        }
      }

      // If all fail, clear token and user
      console.log('All profile checks failed, clearing auth');
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phoneNumber: string, countryCode: string, isAdmin = false, isSystemOwner = false): Promise<{ success: boolean; error?: string }> => {
    try {
      let response;
      if (isSystemOwner) {
        response = await apiClient.systemOwnerLogin({ email, phoneNumber, countryCode });
      } else if (isAdmin) {
        response = await apiClient.adminLogin({ email, phoneNumber, countryCode });
      } else {
        response = await apiClient.userLogin({ email, phoneNumber, countryCode });
      }

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        let userData: any;
        let userType: string;
        
        if (isSystemOwner) {
          // For system owner login, the backend returns system owner data directly
          userData = (response.data as any).systemOwner || response.data;
          userType = 'system_owner';
        } else if (isAdmin) {
          // For admin login, the backend returns admin data directly
          userData = (response.data as any).admin || response.data;
          userType = userData.role; // 'admin' or 'super_admin'
        } else {
          // For user login, the backend returns user data directly
          userData = (response.data as any).user || response.data;
          userType = 'member';
        }
        
        // Store user type in localStorage for auth checking
        localStorage.setItem('userType', userType);
        
        console.log('Setting user data after login:', userData);
        setUser(userData);
        return { success: true };
      } else {
        console.error('Login failed:', response.error);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
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
        localStorage.setItem('token', response.data.token);
        let userData;
        
        let userType: string;
        
        if (isSystemOwner) {
          // For system owner registration, the backend returns system owner data directly
          userData = (response.data as any).systemOwner || response.data;
          userType = 'system_owner';
        } else if (isAdmin) {
          // For admin registration, the backend returns admin data directly
          userData = (response.data as any).admin || response.data;
          userType = userData.role; // 'admin' or 'super_admin'
        } else {
          // For user registration, the backend returns user data directly
          userData = (response.data as any).user || response.data;
          userType = 'member';
        }
        
        // Store user type in localStorage for auth checking
        localStorage.setItem('userType', userType);
        
        console.log('Setting user data after registration:', userData);
        setUser(userData);
        return { success: true };
      } else {
        console.error('Registration failed:', response.error);
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    setUser(null);
  };

  const updateProfile = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.updateUserProfile(data);
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        console.error('Profile update failed:', response.error);
        return { success: false, error: response.error || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
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
    login,
    register,
    logout,
    updateProfile,
  };

  console.log('Auth context value:', { user, isAdmin: user?.role === 'admin', userRole: user?.role });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 