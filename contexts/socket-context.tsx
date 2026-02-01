'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import config from '@/lib/config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  token?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socketBaseUrl = config.apiBaseUrl.replace('/api', '');
    const socketInstance = io(socketBaseUrl, {
      auth: {
        token: token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('reconnect_error', (error) => {
      setConnectionError(`Reconnection failed: ${error.message || 'Unknown error'}`);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};