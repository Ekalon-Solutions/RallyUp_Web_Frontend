'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { toast } from 'sonner';

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
  connectionId?: string;
  isTyping: boolean;
}

interface PresenceEvent {
  connectionId: string;
  userId: string;
  isOnline: boolean;
}

interface UseMessagingProps {
  connectionId: string | null;
  currentUserId: string;
  onNewMessage?: (message: Message) => void;
  onMessagesRead?: (data: { connectionId: string; readBy: string; readAt: string }) => void;
}

const clubIdOf = (club: any): string => {
  if (!club) return '';
  if (typeof club === 'string') return club;
  return String(club._id || club.id || '');
};

export const useMessaging = ({
  connectionId,
  currentUserId,
  onNewMessage,
  onMessagesRead,
}: UseMessagingProps) => {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessagesReadRef = useRef(onMessagesRead);
  const connectionIdRef = useRef(connectionId);

  onNewMessageRef.current = onNewMessage;
  onMessagesReadRef.current = onMessagesRead;
  connectionIdRef.current = connectionId;

  useEffect(() => {
    setTypingUsers([]);
    setPeerOnline(false);
    setIsTyping(false);
  }, [connectionId]);

  useEffect(() => {
    if (!socket || !connectionId) return;

    const join = () => {
      socket.emit('join-conversation', connectionId);
    };

    join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      if (socket.connected) {
        socket.emit('leave-conversation', connectionId);
      }
    };
  }, [socket, connectionId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      onNewMessageRef.current?.(message);
    };

    const handleMessagesRead = (data: { connectionId: string; readBy: string; readAt: string }) => {
      onMessagesReadRef.current?.(data);
    };

    const handleUserTyping = (data: TypingUser) => {
      if (!data?.userId || data.userId === currentUserId) return;
      if (data.connectionId && data.connectionId !== connectionIdRef.current) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          const existingIndex = prev.findIndex((user) => user.userId === data.userId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = data;
            return updated;
          }
          return [...prev, data];
        }
        return prev.filter((user) => user.userId !== data.userId);
      });
    };

    const handlePresence = (data: PresenceEvent) => {
      if (!data || data.connectionId !== connectionIdRef.current) return;
      if (data.userId === currentUserId) return;
      setPeerOnline(Boolean(data.isOnline));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('messages-read', handleMessagesRead);
    socket.on('user-typing', handleUserTyping);
    socket.on('conversation-presence', handlePresence);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('messages-read', handleMessagesRead);
      socket.off('user-typing', handleUserTyping);
      socket.off('conversation-presence', handlePresence);
    };
  }, [socket, currentUserId]);

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

  const markMessagesAsRead = useCallback((targetConnectionId?: string) => {
    const id = targetConnectionId || connectionId;
    if (!socket || !id) return;
    socket.emit('mark-messages-read', { connectionId: id });
  }, [socket, connectionId]);

  return {
    isConnected,
    peerOnline,
    typingUsers,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    isTyping,
  };
};

export const useConnectionNotifications = (currentUserId: string, clubId?: string) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const clubIdRef = useRef(clubId);
  clubIdRef.current = clubId;

  useEffect(() => {
    if (!socket) return;

    const isForActiveClub = (payload: any) => {
      const activeClub = clubIdRef.current;
      if (!activeClub) return true;
      const eventClub = clubIdOf(payload?.club);
      return !eventClub || eventClub === String(activeClub);
    };

    const handleConnectionRequest = (requestData: any) => {
      if (!isForActiveClub(requestData)) return;
      const requesterName = `${requestData.requester?.first_name || ''} ${requestData.requester?.last_name || ''}`.trim();

      toast.info('New connection request', {
        description: `${requesterName || 'A member'} wants to connect with you in this club`,
      });

      setNotifications((prev) => [...prev, {
        id: requestData._id,
        type: 'connection-request',
        data: requestData,
        timestamp: new Date(),
      }]);
    };

    const handleConnectionResponse = (responseData: any) => {
      if (!isForActiveClub(responseData)) return;
      const recipientName = `${responseData.recipient?.first_name || ''} ${responseData.recipient?.last_name || ''}`.trim();
      const status = responseData.status;

      if (status === 'accepted') {
        toast.success('Connection accepted', {
          description: `${recipientName || 'A member'} accepted your connection request`,
        });
      } else {
        toast.error('Connection declined', {
          description: `${recipientName || 'A member'} declined your connection request`,
        });
      }

      setNotifications((prev) => [...prev, {
        id: `${responseData._id}-${status}`,
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
  }, [socket, currentUserId]);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
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
