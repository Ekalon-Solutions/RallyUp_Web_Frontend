'use client';

import React, { useEffect, useState } from 'react';
import { SocketProvider } from '@/contexts/socket-context';
import { useSocket } from '@/contexts/socket-context';
import { useAuth } from '@/contexts/auth-context';

interface SocketWrapperProps {
  children: React.ReactNode;
}

function ForceLogoutListener() {
  const { socket } = useSocket();
  const { logout } = useAuth();

  useEffect(() => {
    if (!socket) return;
    const handle = () => {
      logout();
      window.location.replace('/login');
    };
    socket.on('force_logout', handle);
    return () => {
      socket.off('force_logout', handle);
    };
  }, [socket, logout]);

  return null;
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
      <ForceLogoutListener />
      {children}
    </SocketProvider>
  );
};
