'use client';

import { useEffect, useCallback, useState } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { useToast } from './use-toast';

interface Message {
  _id: string;
  connection?: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  recipient: {
    _id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  message: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  isEdited?: boolean;
  editedAt?: string;
}

interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface UseMessagingProps {
  connectionId: string | null;
  currentUserId: string;
  onNewMessage?: (message: Message) => void;
  onMessagesRead?: (data: { connectionId: string; readBy: string; readAt: string }) => void;
}

export const useMessaging = ({
  connectionId,
  currentUserId,
  onNewMessage,
  onMessagesRead,
}: UseMessagingProps) => {
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Join/leave conversation room
  useEffect(() => {
    if (!socket || !connectionId) return;

    socket.emit('join-conversation', connectionId);

    return () => {
      socket.emit('leave-conversation', connectionId);
    };
  }, [socket, connectionId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (onNewMessage) {
        onNewMessage(message);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, onNewMessage]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: TypingUser) => {
      if (data.userId === currentUserId) return; // Don't show own typing

      setTypingUsers(prev => {
        if (data.isTyping) {
          const existingIndex = prev.findIndex(user => user.userId === data.userId);
          if (existingIndex >= 0) {
            // Update existing typing user
            const updated = [...prev];
            updated[existingIndex] = data;
            return updated;
          } else {
            // Add new typing user
            return [...prev, data];
          }
        } else {
          // Remove typing user
          return prev.filter(user => user.userId !== data.userId);
        }
      });
    };

    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, currentUserId]);

  // Listen for message read status
  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = (data: { connectionId: string; readBy: string; readAt: string }) => {
      if (onMessagesRead) {
        onMessagesRead(data);
      }
    };

    socket.on('messages-read', handleMessagesRead);

    return () => {
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, onMessagesRead]);

  // Typing indicators
  const startTyping = useCallback((userName: string) => {
    if (!socket || !connectionId || isTyping) return;

    setIsTyping(true);
    socket.emit('typing-start', { connectionId, userName });
  }, [socket, connectionId, isTyping]);

  const stopTyping = useCallback(() => {
    if (!socket || !connectionId || !isTyping) return;

    setIsTyping(false);
    socket.emit('typing-stop', { connectionId });
  }, [socket, connectionId, isTyping]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(() => {
    if (!socket || !connectionId) return;

    socket.emit('mark-messages-read', { connectionId });
  }, [socket, connectionId]);

  return {
    isConnected,
    typingUsers,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    isTyping,
  };
};

// Hook for connection notifications
export const useConnectionNotifications = (currentUserId: string) => {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleConnectionRequest = (requestData: any) => {
      const requesterName = `${requestData.requester.first_name} ${requestData.requester.last_name}`;
      
      toast({
        title: "New Connection Request",
        description: `${requesterName} wants to connect with you`,
      });

      setNotifications(prev => [...prev, {
        id: requestData._id,
        type: 'connection-request',
        data: requestData,
        timestamp: new Date(),
      }]);
    };

    const handleConnectionResponse = (responseData: any) => {
      const recipientName = `${responseData.recipient.first_name} ${responseData.recipient.last_name}`;
      const status = responseData.status;
      
      toast({
        title: "Connection Request Response",
        description: `${recipientName} ${status} your connection request`,
        variant: status === 'accepted' ? 'default' : 'destructive',
      });

      setNotifications(prev => [...prev, {
        id: responseData._id,
        type: 'connection-response',
        data: responseData,
        timestamp: new Date(),
      }]);
    };

    socket.on('new-connection-request', handleConnectionRequest);
    socket.on('connection-response', handleConnectionResponse);

    return () => {
      socket.off('new-connection-request', handleConnectionRequest);
      socket.off('connection-response', handleConnectionResponse);
    };
  }, [socket, toast]);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotification,
    clearAllNotifications,
  };
};