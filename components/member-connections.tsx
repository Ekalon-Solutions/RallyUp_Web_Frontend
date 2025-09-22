'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Send, 
  Search,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import config from '@/lib/config';

// Interfaces
interface Member {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
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
  sender: Member;
  recipient: Member;
  message: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  readAt?: string;
  isRead: boolean;
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
  
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.token) {
      fetchMembers();
      fetchConnectionRequests();
      fetchMyConnections();
    }
  }, [currentUser, clubId]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
  });

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/clubs/${clubId}/members`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const clubMembers = data.memberships?.map((membership: any) => ({
          _id: membership.user._id,
          first_name: membership.user.first_name,
          last_name: membership.user.last_name,
          email: membership.user.email,
          profilePicture: membership.user.profilePicture
        })) || [];
        setMembers(clubMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/requests`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns { requests: [...], counts: {...} }
        const requests = data.requests || [];
        setConnectionRequests(requests);
      } else {
        console.error('Failed to fetch connection requests:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    }
  };

  const fetchMyConnections = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/my-connections`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
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
      console.error('Error fetching conversation:', error);
    }
  };

  const sendConnectionRequest = async (recipientId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/send-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientId,
          clubId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Connection request sent successfully",
        });
        fetchConnectionRequests();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send connection request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/respond-request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestId,
          action
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Connection request ${action}ed successfully`,
        });
        fetchConnectionRequests();
        fetchMyConnections();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} request`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/send-message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connectionId: selectedConversation,
          content: newMessage.trim()
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchConversation(selectedConversation);
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getConnectionStatus = (memberId: string) => {
    const sentRequest = connectionRequests.find(req => 
      req.requester._id === currentUser?._id && req.recipient._id === memberId
    );
    
    const receivedRequest = connectionRequests.find(req => 
      req.recipient._id === currentUser?._id && req.requester._id === memberId
    );
    
    const connection = myConnections.find(conn => 
      (conn.requester._id === currentUser?._id && conn.recipient._id === memberId) ||
      (conn.recipient._id === currentUser?._id && conn.requester._id === memberId)
    );

    if (connection && connection.status === 'accepted') return 'connected';
    if (sentRequest && sentRequest.status === 'pending') return 'sent';
    if (receivedRequest && receivedRequest.status === 'pending') return 'received';
    return 'none';
  };

  // Filter data based on current user
  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = connectionRequests.filter(req => {
    const currentUserId = currentUser?._id?.toString();
    const recipientId = req.recipient?._id?.toString();
    return recipientId === currentUserId && req.status === 'pending';
  });

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
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{member.first_name} {member.last_name}</h3>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status === 'none' && (
                          <Button
                            onClick={() => sendConnectionRequest(member._id)}
                            disabled={loading}
                            size="sm"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
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
                            {request.requester.first_name.charAt(0)}{request.requester.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {request.requester.first_name} {request.requester.last_name}
                          </h4>
                          <p className="text-xs text-gray-500">{request.requester.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => respondToRequest(request._id, 'accept')}
                          disabled={loading}
                          size="sm"
                          variant="default"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => respondToRequest(request._id, 'decline')}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-4 h-4 mr-1" />
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
                      console.warn('Connection missing requester or recipient:', connection);
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
                              {otherUser.first_name.charAt(0)}{otherUser.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {otherUser.first_name} {otherUser.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{otherUser.email}</p>
                            <p className="text-xs text-gray-400">
                              Connected on {new Date(connection.updatedAt).toLocaleDateString()}
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
                    myConnections.map((connection) => {
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
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                            selectedConversation === connection._id ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => {
                            setSelectedConversation(connection._id);
                            fetchConversation(connection._id);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={otherUser.profilePicture} />
                              <AvatarFallback>
                                {otherUser.first_name.charAt(0)}{otherUser.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {otherUser.first_name} {otherUser.last_name}
                              </h4>
                              <p className="text-sm text-gray-500 truncate">{otherUser.email}</p>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedConversation ? (
                    (() => {
                      const connection = myConnections.find(c => c._id === selectedConversation);
                      if (!connection || !connection.requester || !connection.recipient) {
                        return 'Select a conversation';
                      }
                      const otherUser = connection.requester._id === currentUser?._id 
                        ? connection.recipient 
                        : connection.requester;
                      return `${otherUser.first_name} ${otherUser.last_name}`;
                    })()
                  ) : (
                    'Select a conversation'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[500px]">
                {selectedConversation ? (
                  <>
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4">
                        {Array.isArray(conversations[selectedConversation]) && conversations[selectedConversation].length > 0 ? (
                          conversations[selectedConversation].map((message) => (
                            <div
                              key={message._id}
                              className={`flex ${
                                message.sender._id === currentUser?._id ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  message.sender._id === currentUser?._id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100'
                                }`}
                              >
                                <p>{message.message}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.sender._id === currentUser?._id
                                      ? 'text-blue-100'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    <div className="p-4 border-t">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="flex-1 resize-none"
                          rows={2}
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
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