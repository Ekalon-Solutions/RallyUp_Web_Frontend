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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Smile,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Phone,
  Video,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMessaging, useConnectionNotifications } from '@/hooks/use-messaging';
import config from '@/lib/config';

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
    clubName: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
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
  
  const { toast } = useToast();

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

  // Helper function to get last message preview
  const getLastMessagePreview = (connectionId: string) => {
    const messages = conversations[connectionId];
    if (!messages || messages.length === 0) {
      return 'Start a conversation...';
    }
    const lastMessage = messages[messages.length - 1];
    const isCurrentUser = lastMessage.sender._id === currentUser?._id;
    const prefix = isCurrentUser ? 'You: ' : '';
    const messageText = lastMessage.message.length > 30 
      ? lastMessage.message.substring(0, 30) + '...' 
      : lastMessage.message;
    return prefix + messageText;
  };

  // Helper function to get last message time
  const getLastMessageTime = (connectionId: string) => {
    const messages = conversations[connectionId];
    if (!messages || messages.length === 0) {
      return '';
    }
    const lastMessage = messages[messages.length - 1];
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

  // Real-time messaging hooks
  const { 
    isConnected, 
    typingUsers, 
    startTyping, 
    stopTyping, 
    markMessagesAsRead,
    isTyping 
  } = useMessaging({
    connectionId: selectedConversation,
    currentUserId: currentUser?._id,
    onNewMessage: (message: Message) => {
      // Update conversations for any connection, not just selected one
      const connId = message.connection || selectedConversation;
      if (connId) {
        setConversations(prev => ({
          ...prev,
          [connId]: [...(prev[connId] || []), message]
        }));
        
        // If it's the selected conversation, scroll to bottom and mark as read
        if (selectedConversation && connId === selectedConversation) {
          scrollToBottom();
          markMessagesAsRead();
        }
      }
    },
    onMessagesRead: (data) => {
      // Update read status in UI if needed
      // // console.log('Messages marked as read:', data);
    }
  });

  const { notifications } = useConnectionNotifications(currentUser?._id);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedConversation, scrollToBottom]);

  useEffect(() => {
    if (currentUser?.token) {
      fetchMembers();
      fetchConnectionRequests();
      fetchMyConnections();
    }
  }, [currentUser, clubId]);

  // Debug log when data changes
  useEffect(() => {
    // // console.log('=== Member Connections Data ===');
    // // console.log('Current User ID:', currentUser?._id);
    // // console.log('Members count:', members.length);
    // // console.log('Connection Requests:', connectionRequests.length, connectionRequests);
    // // console.log('My Connections:', myConnections.length, myConnections);
    // // console.log('==============================');
  }, [members, connectionRequests, myConnections, currentUser]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      // // console.log('Fetching members for club:', clubId);
      // console.log('Auth headers:', getAuthHeaders());
      
      const response = await fetch(`${config.apiBaseUrl}/clubs/${clubId}/members`, {
        headers: getAuthHeaders(),
      });
      
      // // console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        // // console.log('Club memberships response:', data); // Debug log
        const clubMembers = data.memberships?.map((member: any) => ({
          _id: member._id || '',
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          email: member.email || '',
          profilePicture: member.profilePicture || ''
        })).filter((member: any) => member._id) || [];
        // // console.log('Processed members:', clubMembers);
        setMembers(clubMembers);
      } else {
        const errorText = await response.text();
        // // console.error('Failed to fetch members:', response.status, response.statusText, errorText);
        toast({ 
          title: "Error", 
          description: `Failed to load club members: ${response.statusText}`,
          variant: "destructive" 
        });
      }
    } catch (error) {
      // // console.error('Error fetching members:', error);
      toast({ 
        title: "Error", 
        description: "Network error while loading members",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      // // console.log('Fetching connection requests...');
      const response = await fetch(`${config.apiBaseUrl}/member-connections/requests`, {
        headers: getAuthHeaders(),
      });
      
      // // console.log('Connection requests response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // // console.log('Connection requests raw data:', data);
        // Backend returns { requests: [...], counts: {...} }
        const requests = (data.requests || []).filter((request: any) => 
          request?.requester?._id && request?.recipient?._id
        );
        // // console.log('Filtered connection requests:', requests.length);
        
        // Log each request to see structure
        requests.forEach((req: any, idx: number) => {
          // // console.log(`Request ${idx}:`, {
//             _id: req._id,
//             requester: req.requester?._id || req.requester,
//             recipient: req.recipient?._id || req.recipient,
//             status: req.status
//           });
        });
        
        setConnectionRequests(requests);
      } else {
        const errorText = await response.text();
        // // console.error('Failed to fetch connection requests:', response.status, errorText);
        toast({ 
          title: "Error", 
          description: "Failed to load connection requests",
          variant: "destructive" 
        });
      }
    } catch (error) {
      // // console.error('Error fetching connection requests:', error);
      toast({ 
        title: "Error", 
        description: "Network error while loading connection requests",
        variant: "destructive" 
      });
    }
  };

  const fetchMyConnections = async () => {
    try {
      // // console.log('Fetching my connections...');
      const response = await fetch(`${config.apiBaseUrl}/member-connections/my-connections`, {
        headers: getAuthHeaders(),
      });
      
      // // console.log('My connections response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // // console.log('My connections raw data:', data);
        // // console.log('Connections array:', data.connections);
        
        // Log first connection to see structure
        if (data.connections && data.connections.length > 0) {
          // // console.log('First connection structure:', data.connections[0]);
        }
        
        // Filter out any malformed connections
        const connections = (data.connections || []).filter((connection: any) => 
          connection?._id && connection?.requester && connection?.recipient
        );
        
        // // console.log('Filtered connections count:', connections.length);
        setMyConnections(connections);
        
        // Load last message for each connection for preview
        connections.forEach((connection: any) => {
          if (connection._id && !conversations[connection._id]) {
            fetchConversation(connection._id);
          }
        });
      } else {
        // // console.error('Failed to fetch connections:', response.statusText);
        toast({ 
          title: "Error", 
          description: "Failed to load your connections",
          variant: "destructive" 
        });
      }
    } catch (error) {
      // // console.error('Error fetching connections:', error);
      toast({ 
        title: "Error", 
        description: "Network error while loading connections",
        variant: "destructive" 
      });
    }
  };

  const fetchConversation = async (connectionId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/conversation/${connectionId}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns { messages: [...], pagination: {...} }
        const messages = data.messages || [];
        setConversations(prev => ({
          ...prev,
          [connectionId]: messages
        }));
      }
    } catch (error) {
      // // console.error('Error fetching conversation:', error);
    }
  };

  const sendConnectionRequest = async (recipientId: string) => {
    setLoadingStates(prev => ({ ...prev, [`connect_${recipientId}`]: true }));
    // // console.log('Sending connection request to:', recipientId, 'for club:', clubId);
    // console.log('Auth headers:', getAuthHeaders());
    // // console.log('API URL:', `${config.apiBaseUrl}/member-connections/send-request`);
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/send-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientId,
          clubId
        }),
      });

      // // console.log('Connection request response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        // // console.log('Connection request successful:', data);
        toast({
          title: "Success",
          description: "Connection request sent successfully",
        });
        fetchConnectionRequests();
        fetchMyConnections();
      } else {
        const errorText = await response.text();
        // // console.error('Connection request failed:', response.status, errorText);
        let errorMessage = "Failed to send connection request";
        let shouldRefreshData = false;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
          
          // If connection already exists, refresh the data to update UI
          if (errorMessage.toLowerCase().includes('already exists') || 
              errorMessage.toLowerCase().includes('already connected')) {
            shouldRefreshData = true;
            errorMessage = "You are already connected to this member";
          }
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        toast({
          title: shouldRefreshData ? "Info" : "Error",
          description: errorMessage,
          variant: shouldRefreshData ? "default" : "destructive",
        });
        
        // Refresh data if connection already exists to update the UI
        if (shouldRefreshData) {
          fetchConnectionRequests();
          fetchMyConnections();
        }
      }
    } catch (error) {
      // // console.error('Network error sending connection request:', error);
      // console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`connect_${recipientId}`]: false }));
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoadingStates(prev => ({ ...prev, [`request_${requestId}_${action}`]: true }));
    // // console.log(`Responding to request ${requestId} with action: ${action}`);
    // // console.log('Current user:', currentUser);
    // // console.log('Current user ID:', currentUser?._id);
    // console.log('Auth headers:', getAuthHeaders());
    // console.log('Request body:', JSON.stringify({ requestId, action }));
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/respond-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestId,
          action
        }),
      });

      // // console.log(`Response status for ${action}:`, response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        // // console.log(`${action} request successful:`, data);
        toast({
          title: "Success",
          description: `Connection request ${action}ed successfully`,
        });
        
        // Refresh data after a small delay to ensure backend has updated
        setTimeout(() => {
          // // console.log('Refreshing connection data after accept/decline...');
          fetchConnectionRequests();
          fetchMyConnections();
        }, 300);
      } else {
        const errorText = await response.text();
        // // console.error(`Failed to ${action} request:`, response.status, errorText);
        let errorMessage = `Failed to ${action} request`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error(`Network error ${action}ing request:`, error);
      // console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`request_${requestId}_${action}`]: false }));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      // console.log('Cannot send message:', { 
      //   hasMessage: !!newMessage.trim(), 
      //   hasConversation: !!selectedConversation 
      // });
      return;
    }

    // // console.log('=== Sending Message ===');
    // // console.log('Selected conversation ID:', selectedConversation);
    // // console.log('Current user:', currentUser);
    // // console.log('Current user ID:', currentUser?._id);
    // console.log('Message content:', newMessage.trim());
    // console.log('Auth headers:', getAuthHeaders());
    
    // Find the connection details for debugging
    const connection = myConnections.find(c => c._id === selectedConversation);
    // // console.log('Connection details:', connection);

    setLoadingStates(prev => ({ ...prev, sendingMessage: true }));
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/send-message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connectionId: selectedConversation,
          content: newMessage.trim()
        }),
      });

      // // console.log('Send message response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        // // console.log('Message sent successfully:', data);
        setNewMessage('');
        stopTyping();
        // Refresh conversation to show the new message
        fetchConversation(selectedConversation);
      } else {
        const errorText = await response.text();
        // // console.error('Failed to send message:', response.status, errorText);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error('Network error sending message:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
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
    const currentUserId = currentUser?._id;
    
    // Check sent requests
    const sentRequest = connectionRequests.find(req => 
      req.requester?._id === currentUserId && req.recipient?._id === memberId
    );
    
    // Check received requests
    const receivedRequest = connectionRequests.find(req => 
      req.recipient?._id === currentUserId && req.requester?._id === memberId
    );
    
    // Check existing connections (including accepted status)
    const connection = myConnections.find(conn => {
      const isRequester = conn.requester?._id === currentUserId && conn.recipient?._id === memberId;
      const isRecipient = conn.recipient?._id === currentUserId && conn.requester?._id === memberId;
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
    const currentUserId = currentUser?._id?.toString();
    const recipientId = req.recipient?._id?.toString();
    const requesterId = req.requester?._id?.toString();
    
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
        <TabsList className="grid w-full grid-cols-4">
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
                {filteredMembers.filter(member => member._id !== currentUser?._id).map((member) => {
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
                    
                    const otherUser = connection.requester._id === currentUser?._id 
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
                          onClick={() => {
                            setSelectedConversation(connection._id);
                            setActiveTab('messages');
                            fetchConversation(connection._id);
                          }}
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
                        const otherUser = connection.requester._id === currentUser?._id 
                          ? connection.recipient 
                          : connection.requester;
                        return userNameIncludes(otherUser, messageSearch);
                      })
                      .map((connection) => {
                      // Safety check for populated fields
                      if (!connection.requester || !connection.recipient) {
                        return null;
                      }
                      
                      const otherUser = connection.requester._id === currentUser?._id 
                        ? connection.recipient 
                        : connection.requester;

                      return (
                        <div
                          key={connection._id}
                          className={`p-4 border-b cursor-pointer transition-all duration-200 ${
                            selectedConversation === connection._id 
                              ? 'bg-blue-500/10 border-blue-400 shadow-sm' 
                              : 'bg-gray-800/30 hover:bg-gray-700/50 border-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedConversation(connection._id);
                            fetchConversation(connection._id);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-12 h-12 border-2 border-gray-600">
                                <AvatarImage src={otherUser.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-base">
                                  {getUserInitials(otherUser)}
                                </AvatarFallback>
                              </Avatar>
                              {/* Online status indicator */}
                              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full shadow-lg" />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h4 className="font-semibold text-white truncate text-base">
                                  {getUserFullName(otherUser)}
                                </h4>
                                <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
                                  {getLastMessageTime(connection._id)}
                                </span>
                              </div>
                              <p className={`text-sm truncate leading-relaxed ${
                                selectedConversation === connection._id 
                                  ? 'text-blue-200' 
                                  : 'text-gray-400'
                              }`}>
                                {getLastMessagePreview(connection._id)}
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
                        const otherUser = connection.requester._id === currentUser?._id 
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
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {getUserFullName(otherUser)}
                              </CardTitle>
                              <p className="text-sm text-green-600 flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 inline-block" />
                                {isConnected ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <CardTitle className="text-lg">Select a conversation</CardTitle>
                    )}
                  </div>
                  {selectedConversation && (
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {selectedConversation ? (
                  <>
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4 p-4">
                        {isLoadingMessages ? (
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
                              const isCurrentUser = message.sender._id === currentUser?._id;
                              const showAvatar = index === 0 || 
                                conversations[selectedConversation][index - 1].sender._id !== message.sender._id;
                              
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
                                        {message.sender.first_name.charAt(0)}
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
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 hover:bg-gray-100"
                            onClick={() => {
                              // Add emoji picker functionality later
                              toast({
                                title: "Coming Soon",
                                description: "Emoji picker will be available in next update",
                              });
                            }}
                          >
                            <Smile className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 hover:bg-gray-100"
                            onClick={() => {
                              // Add file attachment functionality later
                              toast({
                                title: "Coming Soon",
                                description: "File sharing will be available in next update",
                              });
                            }}
                          >
                            <FileText className="w-4 h-4 text-gray-600" />
                          </Button>
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