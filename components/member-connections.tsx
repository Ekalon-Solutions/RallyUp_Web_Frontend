"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  UserPlus, 
  Users, 
  MessageCircle, 
  Send, 
  Check, 
  X, 
  Shield,
  Search,
  MoreVertical
} from 'lucide-react';
import config from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

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
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requestedAt: string;
  respondedAt?: string;
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

interface Conversation {
  connection: ConnectionRequest;
  messages: Message[];
  unreadCount: number;
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
    'Authorization': `Bearer ${currentUser?.token}`,
    'Content-Type': 'application/json',
  });

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/users/club/${clubId}/members`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.filter((member: Member) => member._id !== currentUser?._id));
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
        console.log('My connections response:', data);
        // Backend returns { connections: [...], total: number }
        const connections = data.connections || [];
        setMyConnections(connections);
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
          title: "Connection Request Sent",
          description: "Your connection request has been sent successfully.",
        });
        fetchConnectionRequests();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send connection request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          title: action === 'accept' ? "Request Accepted" : "Request Declined",
          description: `Connection request ${action}ed successfully.`,
        });
        fetchConnectionRequests();
        fetchMyConnections();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} request.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (connectionId: string) => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/member-connections/send-message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          connectionId,
          content: newMessage,
          messageType: 'text'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchConversation(connectionId);
      } else {
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatus = (memberId: string) => {
    // Check if there's a pending request from me
    const sentRequest = connectionRequests.find(req => 
      req.requester._id === currentUser?._id && req.recipient._id === memberId && req.status === 'pending'
    );
    
    // Check if there's a pending request to me
    const receivedRequest = connectionRequests.find(req => 
      req.requester._id === memberId && req.recipient._id === currentUser?._id && req.status === 'pending'
    );
    
    // Check if already connected
    const connection = myConnections.find(conn => 
      (conn.requester._id === memberId || conn.recipient._id === memberId) && conn.status === 'accepted'
    );

    if (connection) return { status: 'connected', connection };
    if (sentRequest) return { status: 'sent' };
    if (receivedRequest) return { status: 'received', request: receivedRequest };
    return { status: 'none' };
  };

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
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Connections
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredMembers.map((member) => {
                  const connectionInfo = getConnectionStatus(member._id);
                  
                  return (
                    <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
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
                      
                      <div className="flex items-center gap-2">
                        {connectionInfo.status === 'none' && (
                          <Button
                            onClick={() => sendConnectionRequest(member._id)}
                            disabled={loading}
                            size="sm"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                        )}
                        
                        {connectionInfo.status === 'sent' && (
                          <Badge variant="secondary">Request Sent</Badge>
                        )}
                        
                        {connectionInfo.status === 'received' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => respondToRequest(connectionInfo.request!._id, 'accept')}
                              disabled={loading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToRequest(connectionInfo.request!._id, 'decline')}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {connectionInfo.status === 'connected' && (
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

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending connection requests</p>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.requester.profilePicture} />
                          <AvatarFallback>
                            {request.requester.first_name.charAt(0)}{request.requester.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {request.requester.first_name} {request.requester.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Sent {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => respondToRequest(request._id, 'accept')}
                          disabled={loading}
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => respondToRequest(request._id, 'decline')}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
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

        <TabsContent value="connections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {myConnections.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No connections yet</p>
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
                        <div className="flex items-center gap-3">
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
                            <p className="text-sm text-gray-500">
                              Connected {new Date(connection.respondedAt || connection.requestedAt).toLocaleDateString()}
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
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
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

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {myConnections.map((connection) => {
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
                        onClick={() => {
                          setSelectedConversation(connection._id);
                          fetchConversation(connection._id);
                        }}
                        className={`p-4 cursor-pointer border-b hover:bg-gray-50 ${
                          selectedConversation === connection._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={otherUser.profilePicture} />
                            <AvatarFallback>
                              {otherUser.first_name.charAt(0)}{otherUser.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {otherUser.first_name} {otherUser.last_name}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              Click to start messaging
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
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
                    'Select a conversation to start messaging'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="flex flex-col h-[400px]">
                    {/* Messages */}
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

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        rows={3}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(selectedConversation);
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMessage(selectedConversation)}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Select a conversation to start messaging</p>
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
