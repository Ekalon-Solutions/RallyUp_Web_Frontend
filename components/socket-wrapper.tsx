'use client';

import React, { useEffect, useState } from 'react';
import { SocketProvider } from '@/contexts/socket-context';
import { useAuth } from '@/contexts/auth-context';

interface SocketWrapperProps {
  children: React.ReactNode;
}

export const SocketWrapper: React.FC<SocketWrapperProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
    } else {
      setToken(null);
    }
  }, [isAuthenticated]);
  
  return (
    <SocketProvider token={token || undefined}>
      {children}
    </SocketProvider>
  );
};