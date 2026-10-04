'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDisplayDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Send, 
  Search,
  Check,
  X,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMessaging, useConnectionNotifications } from '@/hooks/use-messaging';
import { apiClient } from '@/lib/api';

// Interfaces
interface Member {
  _id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profilePicture?: string;
  memberships?: Array<{
    club: {
      _id: string;
      clubName: string;
    };
    status: string;
  }>;
}

interface ConnectionRequest {
  _id: string;
  requester: Member;
  recipient: Member;
  club: {
    _id: string;
    clubName?: string;
    name?: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    _id: string;
    message: string;
    sender: string | { _id: string };
    createdAt: string;
    isRead?: boolean;
  } | null;
}

interface Message {
  _id: string;
  connection?: string;
  sender: Member;
  recipient: Member;
  message: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

interface ClubMember {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profilePicture?: string;
}

const personId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value._id || value.id || '');
};

export default function MemberConnections({ currentUser, clubId }: { currentUser: any, clubId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [myConnections, setMyConnections] = useState<ConnectionRequest[]>([]);
  const [conversations, setConversations] = useState<{ [key: string]: Message[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to safely get user initials
  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName.charAt(0) || 'U'}${lastName.charAt(0) || ''}`;
  };

  // Helper function to safely get user full name
  const getUserFullName = (user: any) => {
    if (!user) return 'Unknown User';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  };

  // Helper function to safely check user name includes search term
  const userNameIncludes = (user: any, searchTerm: string) => {
    if (!user || !searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    const email = user.email || '';
    return (
      firstName.toLowerCase().includes(searchLower) ||
      lastName.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  };

  const currentUserId = personId(currentUser);

  const appendMessage = useCallback((connectionId: string, message: Message) => {
    if (!connectionId || !message?._id) return;
    setConversations((prev) => {
      const existing = prev[connectionId] || [];
      if (existing.some((item) => item._id === message._id)) return prev;
      const next = [...existing, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return { ...prev, [connectionId]: next };
    });
    setMyConnections((prev) => {
      const index = prev.findIndex((connection) => connection._id === connectionId);
      if (index === -1) return prev;
      const updated = {
        ...prev[index],
        lastMessage: {
          _id: message._id,
          message: message.message,
          sender: message.sender,
          createdAt: message.createdAt,
          isRead: message.isRead,
        },
      };
      return [updated, ...prev.filter((connection) => connection._id !== connectionId)];
    });
  }, []);

  // Helper function to get last message preview
  const getLastMessagePreview = (connection: ConnectionRequest) => {
    const messages = conversations[connection._id];
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : connection.lastMessage;
    if (!lastMessage?.message) {
      return 'Start a conversation...';
    }
    const isCurrentUser = personId(lastMessage.sender) === currentUserId;
    const prefix = isCurrentUser ? 'You: ' : '';
    const messageText = lastMessage.message.length > 30
      ? lastMessage.message.substring(0, 30) + '...'
      : lastMessage.message;
    return prefix + messageText;
  };

  // Helper function to get last message time
  const getLastMessageTime = (connection: ConnectionRequest) => {
    const messages = conversations[connection._id];
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : connection.lastMessage;
    if (!lastMessage?.createdAt) {
      return '';
    }
    const messageDate = new Date(lastMessage.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDisplayDate(messageDate);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Real-time messaging hooks
  const { 
    isConnected, 
    peerOnline,
    typingUsers, 
    startTyping, 
    stopTyping, 
    markMessagesAsRead,
    isTyping 
  } = useMessaging({
    connectionId: selectedConversation,
    currentUserId,
    onNewMessage: (message: Message) => {
      const connId = personId(message.connection) || selectedConversation;
      if (!connId) return;
      appendMessage(connId, message);
      if (selectedConversation && connId === selectedConversation && personId(message.sender) !== currentUserId) {
        scrollToBottom();
        markMessagesAsRead(connId);
      }
    },
    onMessagesRead: (data) => {
      if (!data?.connectionId || personId(data.readBy) === currentUserId) return;
      setConversations((prev) => {
        const thread = prev[data.connectionId];
        if (!thread) return prev;
        return {
          ...prev,
          [data.connectionId]: thread.map((message) =>
            personId(message.sender) === currentUserId
              ? { ...message, isRead: true, readAt: data.readAt }
              : message
          ),
        };
      });
    }
  });

  const { notifications } = useConnectionNotifications(currentUserId, clubId);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedConversation, scrollToBottom]);

  const fetchMembers = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const response = await apiClient.getClubChatMembers(clubId);
      if (response.success && response.data) {
        const clubMembers = (response.data.memberships || []).map((member: any) => ({
          _id: personId(member),
          first_name: member.first_name || member.firstName || '',
          last_name: member.last_name || member.lastName || '',
          email: member.email || '',
          profilePicture: member.profilePicture || ''
        })).filter((member: Member) => member._id && member._id !== currentUserId);
        setMembers(clubMembers);
      } else {
        toast.error(response.error || 'Failed to load club members');
      }
    } catch {
      toast.error('Network error while loading members');
    } finally {
      setLoading(false);
    }
  }, [clubId, currentUserId]);

  const fetchConnectionRequests = useCallback(async () => {
    if (!clubId) return;
    try {
      const response = await apiClient.getMemberConnectionRequests(clubId);
      if (response.success && response.data) {
        const requests = (response.data.requests || []).filter((request: any) =>
          personId(request?.requester) && personId(request?.recipient)
        );
        setConnectionRequests(requests);
      } else {
        toast.error(response.error || 'Failed to load connection requests');
      }
    } catch {
      toast.error('Network error while loading connection requests');
    }
  }, [clubId]);

  const fetchMyConnections = useCallback(async () => {
    if (!clubId) return;
    try {
      const response = await apiClient.getMyMemberConnections(clubId);
      if (response.success && response.data) {
        const connections = (response.data.connections || []).filter((connection: any) =>
          connection?._id && connection?.requester && connection?.recipient
        );
        setMyConnections(connections);
      } else {
        toast.error(response.error || 'Failed to load your connections');
      }
    } catch {
      toast.error('Network error while loading connections');
    }
  }, [clubId]);

  const conversationRequestRef = useRef(0);

  const fetchConversation = useCallback(async (connectionId: string) => {
    const requestId = ++conversationRequestRef.current;
    try {
      setIsLoadingMessages(true);
      const response = await apiClient.getMemberConversation(connectionId);
      if (conversationRequestRef.current !== requestId) return;
      if (response.success && response.data) {
        const messages = response.data.messages || [];
        setConversations((prev) => {
          const existing = prev[connectionId] || [];
          const byId = new Map<string, Message>();
          for (const message of [...existing, ...messages]) {
            if (message?._id) byId.set(message._id, message);
          }
          const merged = Array.from(byId.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return { ...prev, [connectionId]: merged };
        });
      }
    } catch {
      if (conversationRequestRef.current === requestId) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (conversationRequestRef.current === requestId) {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUserId || !clubId) return;
    setSelectedConversation(null);
    setConversations({});
    fetchMembers();
    fetchConnectionRequests();
    fetchMyConnections();
  }, [currentUserId, clubId, fetchMembers, fetchConnectionRequests, fetchMyConnections]);

  useEffect(() => {
    if (notifications.length === 0) return;
    fetchConnectionRequests();
    fetchMyConnections();
  }, [notifications, fetchConnectionRequests, fetchMyConnections]);

  const openConversation = (connectionId: string) => {
    setSelectedConversation(connectionId);
    setActiveTab('messages');
    setConversations((prev) => prev[connectionId] ? prev : { ...prev, [connectionId]: [] });
    fetchConversation(connectionId);
    markMessagesAsRead(connectionId);
  };

  const sendConnectionRequest = async (recipientId: string) => {
    setLoadingStates(prev => ({ ...prev, [`connect_${recipientId}`]: true }));
    try {
      const response = await apiClient.sendMemberConnectionRequest(recipientId, clubId);
      if (response.success) {
        toast.success('Connection request sent');
        fetchConnectionRequests();
        fetchMyConnections();
      } else {
        const errorMessage = response.error || 'Failed to send connection request';
        const alreadyConnected = errorMessage.toLowerCase().includes('already');
        if (alreadyConnected) {
          toast.info(errorMessage);
          fetchConnectionRequests();
          fetchMyConnections();
        } else {
          toast.error(errorMessage);
        }
      }
    } catch {
      toast.error('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`connect_${recipientId}`]: false }));
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoadingStates(prev => ({ ...prev, [`request_${requestId}_${action}`]: true }));
    try {
      const response = await apiClient.respondToMemberConnectionRequest(requestId, action);
      if (response.success) {
        toast.success(action === 'accept' ? 'Connection accepted' : 'Connection declined');
        fetchConnectionRequests();
        fetchMyConnections();
      } else {
        toast.error(response.error || `Failed to ${action} request`);
      }
    } catch {
      toast.error('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`request_${requestId}_${action}`]: false }));
    }
  };

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !selectedConversation) return;

    setLoadingStates(prev => ({ ...prev, sendingMessage: true }));
    try {
      const response = await apiClient.sendMemberMessage(selectedConversation, text);
      if (response.success && response.data?.messageData) {
        appendMessage(selectedConversation, response.data.messageData);
        setNewMessage('');
        stopTyping();
        scrollToBottom();
      } else {
        toast.error(response.error || 'Failed to send message');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingMessage: false }));
    }
  };

  // Handle typing indicators
  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    
    if (value.trim() && !isTyping) {
      const userName = `${currentUser?.first_name} ${currentUser?.last_name}`;
      startTyping(userName);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper functions
  const getConnectionStatus = (memberId: string) => {
    const sentRequest = connectionRequests.find(req =>
      personId(req.requester) === currentUserId && personId(req.recipient) === memberId
    );

    const receivedRequest = connectionRequests.find(req =>
      personId(req.recipient) === currentUserId && personId(req.requester) === memberId
    );

    const connection = myConnections.find(conn => {
      const isRequester = personId(conn.requester) === currentUserId && personId(conn.recipient) === memberId;
      const isRecipient = personId(conn.recipient) === currentUserId && personId(conn.requester) === memberId;
      return (isRequester || isRecipient) && conn.status === 'accepted';
    });

    // Debug logging for troubleshooting
    if (memberId && (connection || sentRequest || receivedRequest)) {
      // // console.log('Connection status for member:', memberId, {
//         connection: connection ? 'connected' : null,
//         sentRequest: sentRequest ? 'sent' : null,
//         receivedRequest: receivedRequest ? 'received' : null,
//       });
    }

    if (connection) return 'connected';
    if (sentRequest && sentRequest.status === 'pending') return 'sent';
    if (receivedRequest && receivedRequest.status === 'pending') return 'received';
    return 'none';
  };

  // Filter data based on current user
  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingRequests = connectionRequests.filter(req => {
    const recipientId = personId(req.recipient);
    const requesterId = personId(req.requester);
    
    // Debug log
    // // console.log('Checking request:', {
//       requestId: req._id,
//       currentUserId,
//       recipientId,
//       requesterId,
//       isRecipient: recipientId === currentUserId,
//       status: req.status
//     });
    
    // Only show requests where current user is the RECIPIENT and status is pending
    return recipientId === currentUserId && req.status === 'pending';
  });

  // // console.log('Pending requests to display:', pendingRequests.length);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Member Connections</h1>
        <p className="text-gray-600">Connect and chat with other club members</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Connections
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredMembers.filter(member => personId(member) !== currentUserId).map((member) => {
                  const status = getConnectionStatus(member._id);
                  
                  return (
                    <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.profilePicture} />
                          <AvatarFallback>
                            {getUserInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{getUserFullName(member)}</h3>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status === 'none' && (
                          <Button
                            onClick={() => sendConnectionRequest(member._id)}
                            disabled={loadingStates[`connect_${member._id}`]}
                            size="sm"
                          >
                            {loadingStates[`connect_${member._id}`] ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4 mr-1" />
                            )}
                            Connect
                          </Button>
                        )}
                        {status === 'sent' && (
                          <Badge variant="outline">Request Sent</Badge>
                        )}
                        {status === 'received' && (
                          <Badge variant="secondary">Request Received</Badge>
                        )}
                        {status === 'connected' && (
                          <Badge variant="default">Connected</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No pending requests</h3>
                  <p className="text-gray-500">When someone sends you a connection request, it will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.requester.profilePicture} />
                          <AvatarFallback className="bg-blue-100">
                            {getUserInitials(request.requester)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {getUserFullName(request.requester)}
                          </h4>
                          <p className="text-xs text-gray-500">{request.requester.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDisplayDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => respondToRequest(request._id, 'accept')}
                          disabled={loadingStates[`request_${request._id}_accept`] || loadingStates[`request_${request._id}_decline`]}
                          size="sm"
                          variant="default"
                        >
                          {loadingStates[`request_${request._id}_accept`] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button
                          onClick={() => respondToRequest(request._id, 'decline')}
                          disabled={loadingStates[`request_${request._id}_accept`] || loadingStates[`request_${request._id}_decline`]}
                          size="sm"
                          variant="outline"
                        >
                          {loadingStates[`request_${request._id}_decline`] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <X className="w-4 h-4 mr-1" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Connections Tab */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>My Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {myConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No connections yet</h3>
                  <p className="text-gray-500">Start connecting with other club members!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myConnections.map((connection) => {
                    // Safety check for populated fields
                    if (!connection.requester || !connection.recipient) {
                      // // console.warn('Connection missing requester or recipient:', connection);
                      return null;
                    }
                    
                    const otherUser = personId(connection.requester) === currentUserId
                      ? connection.recipient
                      : connection.requester;

                    return (
                      <div key={connection._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={otherUser.profilePicture} />
                            <AvatarFallback>
                              {getUserInitials(otherUser)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {getUserFullName(otherUser)}
                            </h3>
                            <p className="text-sm text-gray-500">{otherUser.email}</p>
                            <p className="text-xs text-gray-400">
                              Connected on {formatDisplayDate(connection.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => openConversation(connection._id)}
                          size="sm"
                          variant="outline"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {myConnections.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No connections yet</p>
                      <p className="text-xs">Click to start messaging</p>
                    </div>
                  ) : (
                    myConnections
                      .filter((connection) => {
                        if (!messageSearch) return true;
                        const otherUser = personId(connection.requester) === currentUserId
                          ? connection.recipient
                          : connection.requester;
                        return userNameIncludes(otherUser, messageSearch);
                      })
                      .map((connection) => {
                      if (!connection.requester || !connection.recipient) {
                        return null;
                      }

                      const otherUser = personId(connection.requester) === currentUserId
                        ? connection.recipient
                        : connection.requester;

                      return (
                        <div
                          key={connection._id}
                          className={`p-4 border-b cursor-pointer transition-all duration-200 ${
                            selectedConversation === connection._id
                              ? 'bg-primary/10'
                              : 'hover:bg-muted/60'
                          }`}
                          onClick={() => openConversation(connection._id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.profilePicture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
                                {getUserInitials(otherUser)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h4 className="font-semibold truncate text-base">
                                  {getUserFullName(otherUser)}
                                </h4>
                                <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">
                                  {getLastMessageTime(connection)}
                                </span>
                              </div>
                              <p className="text-sm truncate leading-relaxed text-muted-foreground">
                                {getLastMessagePreview(connection)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedConversation ? (
                      (() => {
                        const connection = myConnections.find(c => c._id === selectedConversation);
                        if (!connection || !connection.requester || !connection.recipient) {
                          return <CardTitle className="text-lg">Select a conversation</CardTitle>;
                        }
                        const otherUser = personId(connection.requester) === currentUserId
                          ? connection.recipient
                          : connection.requester;
                        return (
                          <>
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={otherUser.profilePicture} />
                                <AvatarFallback>
                                  {getUserInitials(otherUser)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-background rounded-full ${peerOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {getUserFullName(otherUser)}
                              </CardTitle>
                              <p className={`text-sm flex items-center ${peerOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 inline-block ${peerOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                                {peerOnline ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <CardTitle className="text-lg">Select a conversation</CardTitle>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {selectedConversation ? (
                  <>
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4 p-4">
                        {isLoadingMessages && !(conversations[selectedConversation]?.length) ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex space-x-2">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-[200px]" />
                                  <Skeleton className="h-4 w-[150px]" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : Array.isArray(conversations[selectedConversation]) && conversations[selectedConversation].length > 0 ? (
                          <>
                            {conversations[selectedConversation].map((message, index) => {
                              const isCurrentUser = personId(message.sender) === currentUserId;
                              const showAvatar = index === 0 ||
                                personId(conversations[selectedConversation][index - 1].sender) !== personId(message.sender);
                              
                              return (
                                <div
                                  key={message._id}
                                  className={`flex items-end space-x-2 ${
                                    isCurrentUser ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  {!isCurrentUser && showAvatar && (
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-xs">
                                        {(message.sender?.first_name || 'U').charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  {!isCurrentUser && !showAvatar && (
                                    <div className="w-8 h-8" />
                                  )}
                                  
                                  <div
                                    className={`max-w-[70%] group relative ${
                                      isCurrentUser ? 'ml-auto' : ''
                                    }`}
                                  >
                                    <div
                                      className={`p-3 rounded-2xl shadow-sm ${
                                        isCurrentUser
                                          ? 'bg-blue-500 text-white rounded-br-md'
                                          : 'bg-gray-100 border border-gray-200 rounded-bl-md text-gray-900'
                                      }`}
                                    >
                                      <p className={`text-sm break-words ${
                                        isCurrentUser ? 'text-white' : 'text-gray-900'
                                      }`}>{message.message}</p>
                                      {message.isEdited && (
                                        <p className={`text-xs italic mt-1 ${
                                          isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                                        }`}>
                                          edited
                                        </p>
                                      )}
                                    </div>
                                    
                                    <div className={`flex items-center space-x-1 mt-1 ${
                                      isCurrentUser ? 'justify-end' : 'justify-start'
                                    }`}>
                                      <span className="text-xs text-gray-500">
                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      {isCurrentUser && (
                                        <div className="flex items-center space-x-1">
                                          {message.isRead ? (
                                            <Check className="w-3 h-3 text-blue-500" />
                                          ) : (
                                            <Clock className="w-3 h-3 text-gray-400" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Typing indicators */}
                            {typingUsers.length > 0 && (
                              <div className="flex items-center space-x-2 ml-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {typingUsers[0].userName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {typingUsers[0].userName} is typing...
                                </span>
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                          </>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    <div className="p-4 border-t bg-white">
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <Textarea
                            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                            value={newMessage}
                            onChange={(e) => handleMessageChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="resize-none border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 shadow-sm min-h-[40px] max-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={1}
                          />
                          {!isConnected && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Reconnecting...
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            onClick={sendMessage} 
                            disabled={!newMessage.trim() || loadingStates.sendingMessage}
                            className="h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300"
                          >
                            {loadingStates.sendingMessage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                      <p>Choose a connection from the left to start messaging</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}