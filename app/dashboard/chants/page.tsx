'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { apiClient, Chant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  FileText, 
  Image, 
  Music, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Tag,
  BarChart3,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChantFormData {
  title: string;
  description: string;
  content: string;
  fileType: 'text' | 'image' | 'audio';
  tags: string;
  file: File | null;
}

export default function ChantsManagementPage() {
  const { user } = useAuth();
  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChant, setEditingChant] = useState<Chant | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState<ChantFormData>({
    title: '',
    description: '',
    content: '',
    fileType: 'text',
    tags: '',
    file: null
  });

  const clubId = React.useMemo(() => {
    if (!user || user.role === 'system_owner') return null;
    
    // console.log('🔍 Debugging user object for club ID:', {
      role: user.role,
      user: user,
      club: (user as any).club,
      memberships: (user as any).memberships
    });
    
    // First try to get club from memberships (new structure)
    const userMemberships = (user as any).memberships || [];
    const activeMembership = userMemberships.find((m: any) => m.status === 'active');
    if (activeMembership?.club_id?._id) {
      // // console.log('🔍 Found club ID from active membership:', activeMembership.club_id._id);
      return activeMembership.club_id._id;
    }
    
    // Fallback: try to get club from old club field (for backward compatibility)
    if ((user as any).club?._id) {
      // console.log('🔍 Found club ID from old club field:', (user as any).club._id);
      return (user as any).club._id;
    }
    
    // If still no club, try to find any membership (even if not active)
    if (userMemberships.length > 0 && userMemberships[0]?.club_id?._id) {
      // // console.log('🔍 Found club ID from first membership:', userMemberships[0].club_id._id);
      return userMemberships[0].club_id._id;
    }
    
    // console.log('❌ No club ID found for user:', {
      role: user.role,
      hasMemberships: !!userMemberships.length,
      memberships: userMemberships,
      oldClub: (user as any).club
    });
    return null;
  }, [user]);

  useEffect(() => {
    if (clubId) {
      fetchChants();
      fetchStats();
    }
  }, [clubId, currentPage, selectedFileType, searchTerm]);

  const fetchChants = async () => {
    if (!clubId) return;
    
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (selectedFileType !== 'all') {
        params.fileType = selectedFileType;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await apiClient.getChants(clubId, params);
      if (response.success) {
        setChants(response.data.chants);
        setTotalPages(response.data.pagination.pages);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch chants",
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error('Error fetching chants:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!clubId) return;
    
    try {
      const response = await apiClient.getChantStats(clubId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      // // console.error('Error fetching stats:', error);
    }
  };

  const handleCreateChant = async () => {
    if (!clubId) {
      toast({
        title: "Error",
        description: "No club found. Please ensure you are associated with a club.",
        variant: "destructive",
      });
      return;
    }
    
    // // console.log('🎵 Creating chant for club ID:', clubId);
    
    try {
      const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const response = await apiClient.createChant(clubId, {
        title: formData.title,
        description: formData.description || undefined,
        content: formData.fileType === 'text' ? formData.content : undefined,
        fileType: formData.fileType,
        tags,
        file: formData.file || undefined
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Chant created successfully",
        });
        setShowCreateModal(false);
        resetForm();
        fetchChants();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create chant",
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error('Error creating chant:', error);
      toast({
        title: "Error",
        description: "Failed to create chant",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChant = async () => {
    if (!editingChant) return;
    
    try {
      const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const response = await apiClient.updateChant(editingChant._id, {
        title: formData.title,
        description: formData.description || undefined,
        content: formData.fileType === 'text' ? formData.content : undefined,
        tags,
        file: formData.file || undefined
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Chant updated successfully",
        });
        setShowEditModal(false);
        setEditingChant(null);
        resetForm();
        fetchChants();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update chant",
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error('Error updating chant:', error);
      toast({
        title: "Error",
        description: "Failed to update chant",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChant = async (chantId: string) => {
    if (!confirm('Are you sure you want to delete this chant?')) return;
    
    try {
      const response = await apiClient.deleteChant(chantId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Chant deleted successfully",
        });
        fetchChants();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete chant",
          variant: "destructive",
        });
      }
    } catch (error) {
      // // console.error('Error deleting chant:', error);
      toast({
        title: "Error",
        description: "Failed to delete chant",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      fileType: 'text',
      tags: '',
      file: null
    });
  };

  const openEditModal = (chant: Chant) => {
    setEditingChant(chant);
    setFormData({
      title: chant.title,
      description: chant.description || '',
      content: chant.content || '',
      fileType: chant.fileType,
      tags: chant.tags?.join(', ') || '',
      file: null
    });
    setShowEditModal(true);
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!clubId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Club Found</h3>
              <p className="text-muted-foreground">You need to be associated with a club to manage chants.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact your administrator to assign you to a club.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Our Chants</h1>
              <p className="text-muted-foreground">Manage club chants and traditions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowStats(!showStats)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Chant
              </Button>
            </div>
          </div>

          {/* Statistics */}
          {showStats && stats && (
            <Card>
              <CardHeader>
                <CardTitle>Chant Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalChants}</div>
                    <div className="text-sm text-muted-foreground">Total Chants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.byType.text?.count || 0}</div>
                    <div className="text-sm text-muted-foreground">Text Chants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(stats.byType.image?.count || 0) + (stats.byType.audio?.count || 0)}</div>
                    <div className="text-sm text-muted-foreground">Media Chants</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search chants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Chants List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading chants...</div>
              </div>
            ) : chants.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">No chants found</div>
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Chant
                  </Button>
                </CardContent>
              </Card>
            ) : (
              chants.map((chant) => (
                <Card key={chant._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getFileTypeIcon(chant.fileType)}
                        <div>
                          <CardTitle className="text-lg">{chant.title}</CardTitle>
                          {chant.description && (
                            <CardDescription className="mt-1">
                              {chant.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {chant.fileTypeDisplay || chant.fileType}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(chant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChant(chant._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {chant.fileType === 'text' && chant.content && (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{chant.content}</pre>
                      </div>
                    )}
                    
                    {chant.fileType !== 'text' && chant.fileUrl && (
                      <div className="space-y-2">
                        {chant.fileType === 'image' && (
                          <img 
                            src={chant.fileUrl} 
                            alt={chant.title}
                            className="max-w-full h-auto rounded-lg max-h-64 object-cover"
                          />
                        )}
                        {chant.fileType === 'audio' && (
                          <div className="flex items-center gap-2">
                            <audio controls className="flex-1">
                              <source src={chant.fileUrl} type={chant.mimeType} />
                              Your browser does not support the audio element.
                            </audio>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(chant.fileUrl, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {chant.createdBy.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(chant.createdAt).toLocaleDateString()}
                        </div>
                        {chant.fileSize && (
                          <div>
                            {formatFileSize(chant.fileSize)}
                          </div>
                        )}
                      </div>
                      {chant.tags && chant.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <div className="flex gap-1">
                            {chant.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Create Chant Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Chant</DialogTitle>
                <DialogDescription>
                  Upload text, image, or audio files of club chants to centralize group traditions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chant title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileType">Type *</Label>
                  <Select 
                    value={formData.fileType} 
                    onValueChange={(value: 'text' | 'image' | 'audio') => 
                      setFormData(prev => ({ ...prev, fileType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.fileType === 'text' && (
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter chant text content"
                      rows={6}
                    />
                  </div>
                )}
                
                {formData.fileType !== 'text' && (
                  <div>
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept={formData.fileType === 'image' ? 'image/*' : 'audio/*'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum file size: 50MB
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateChant} disabled={!formData.title}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Chant
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Chant Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Chant</DialogTitle>
                <DialogDescription>
                  Update the chant information and content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chant title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
                
                {formData.fileType === 'text' && (
                  <div>
                    <Label htmlFor="edit-content">Content *</Label>
                    <Textarea
                      id="edit-content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter chant text content"
                      rows={6}
                    />
                  </div>
                )}
                
                {formData.fileType !== 'text' && (
                  <div>
                    <Label htmlFor="edit-file">Replace File</Label>
                    <Input
                      id="edit-file"
                      type="file"
                      accept={formData.fileType === 'image' ? 'image/*' : 'audio/*'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Leave empty to keep current file. Maximum file size: 50MB
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateChant} disabled={!formData.title}>
                    <Upload className="w-4 h-4 mr-2" />
                    Update Chant
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
