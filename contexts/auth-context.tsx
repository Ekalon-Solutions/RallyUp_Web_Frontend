"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User, Admin } from '../lib/api';

interface AuthContextType {
  user: User | Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any, isAdmin?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Admin | null>(null);
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

      // Try to get admin profile first (for admin users)
      const adminResponse = await apiClient.adminProfile();
      console.log('Admin profile response:', adminResponse);
      console.log('Admin profile response.data:', adminResponse.data);
      console.log('Admin profile response.success:', adminResponse.success);
      if (adminResponse.success && adminResponse.data) {
        console.log('Setting user from admin profile:', adminResponse.data);
        setUser(adminResponse.data);
        setIsLoading(false);
        return;
      }

      // If admin profile fails, try user profile (for regular users)
      const userResponse = await apiClient.userProfile();
      console.log('User profile response:', userResponse);
      console.log('User profile response.data:', userResponse.data);
      console.log('User profile response.success:', userResponse.success);
      if (userResponse.success && userResponse.data) {
        console.log('Setting user from user profile:', userResponse.data);
        setUser(userResponse.data);
        setIsLoading(false);
        return;
      }
      

      // If both fail, clear token and user
      console.log('Both profile checks failed, clearing auth');
      localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, isAdmin = false): Promise<{ success: boolean; error?: string }> => {
    try {
      let response;
      if (isAdmin) {
        response = await apiClient.adminLogin({ email, password });
      } else {
        response = await apiClient.userLogin({ email, password });
      }

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        let userData;
        
        if (isAdmin) {
          // For admin login, the backend returns admin data directly
          userData = {
            _id: response.data._id,
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber,
            countryCode: response.data.countryCode,
            isPhoneVerified: response.data.isPhoneVerified,
            role: response.data.role,
            isActive: response.data.isActive,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          };
        } else {
          // For user login, the backend returns user data directly
          userData = response.data;
        }
        
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

  const register = async (userData: any, isAdmin = false): Promise<{ success: boolean; error?: string }> => {
    try {
      let response;
      if (isAdmin) {
        response = await apiClient.adminRegister(userData);
      } else {
        response = await apiClient.userRegister(userData);
      }

      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        let userData;
        
        if (isAdmin) {
          // For admin registration, the backend returns admin data directly
          userData = {
            _id: response.data._id,
            name: response.data.name,
            email: response.data.email,
            phoneNumber: response.data.phoneNumber,
            countryCode: response.data.countryCode,
            isPhoneVerified: response.data.isPhoneVerified,
            role: response.data.role,
            isActive: response.data.isActive,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt
          };
        } else {
          // For user registration, the backend returns user data directly
          userData = response.data;
        }
        
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
    isAdmin: user?.role === 'admin',
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