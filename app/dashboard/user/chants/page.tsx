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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  FileText, 
  Image, 
  Music, 
  Download, 
  Calendar,
  User,
  Tag,
  Play,
  Pause,
  Volume2,
  Heart,
  Share2,
  VolumeX,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MemberChantsPage() {
  const { user } = useAuth();
  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [audioVolume, setAudioVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChants();
    }
  }, [user, currentPage, selectedFileType, searchTerm, showFavoritesOnly]);

  const fetchChants = async () => {
    try {
      setLoading(true);
      
      // Get all club IDs the user is a member of
      const clubIds: string[] = [];
      
      // For admin users, use their assigned club
      if ((user as any).club?._id) {
        clubIds.push((user as any).club._id);
      }
      
      // For users with memberships, get all clubs they're a member of
      const userMemberships = (user as any).memberships || [];
      userMemberships.forEach((membership: any) => {
        const clubId = membership.club_id?._id || membership.club_id;
        if (clubId && !clubIds.includes(clubId)) {
          clubIds.push(clubId);
        }
      });
      
      if (clubIds.length === 0) {
        setChants([]);
        setTotalPages(0);
        setLoading(false);
        return;
      }
      
      // Fetch chants from all clubs
      const allChantsPromises = clubIds.map(clubId => {
        const params: any = {
          page: 1, // Get all pages for now, we'll handle pagination later
          limit: 100 // Increase limit to get more chants per club
        };
        
        if (selectedFileType !== 'all') {
          params.fileType = selectedFileType;
        }
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        return apiClient.getChants(clubId, params);
      });
      
      const responses = await Promise.all(allChantsPromises);
      
      // Combine all chants from all clubs
      let allChants: Chant[] = [];
      responses.forEach(response => {
        if (response.success && response.data) {
          allChants = [...allChants, ...response.data.chants];
        }
      });
      
      // Sort by creation date (newest first)
      allChants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Filter favorites if enabled
      if (showFavoritesOnly) {
        allChants = allChants.filter(chant => favorites.has(chant._id));
      }
      
      // Handle pagination on the frontend
      const itemsPerPage = 12;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedChants = allChants.slice(startIndex, endIndex);
      
      setChants(paginatedChants);
      setTotalPages(Math.ceil(allChants.length / itemsPerPage));
      
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

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'text': return <FileText className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'iframe': return <Globe className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAudioPlay = (chantId: string) => {
    setPlayingAudio(playingAudio === chantId ? null : chantId);
  };

  const toggleFavorite = (chantId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(chantId)) {
        newFavorites.delete(chantId);
      } else {
        newFavorites.add(chantId);
      }
      return newFavorites;
    });
  };

  const handleShare = async (chant: Chant) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: chant.title,
          text: chant.description || 'Check out this club chant!',
          url: window.location.href
        });
      } catch (error) {
        // // console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${chant.title} - ${window.location.href}`);
      toast({
        title: "Link copied!",
        description: "Chant link has been copied to clipboard",
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Check if user has any club memberships
  const hasClubMembership = React.useMemo(() => {
    if (!user) return false;
    const userMemberships = (user as any).memberships || [];
    return userMemberships.length > 0 || !!(user as any).club;
  }, [user]);

  if (!hasClubMembership) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Club Found</h3>
              <p className="text-muted-foreground">You need to be a member of a club to view chants.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please join a club first to access our chants and traditions.
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
              <h1 className="text-3xl font-bold">Club Chants</h1>
              <p className="text-muted-foreground">Learn and participate in traditions from all your clubs</p>
            </div>
          </div>

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
                <div className="flex gap-2">
                  <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="iframe">Embedded Content (iframe)</SelectItem>
                    </SelectContent>
                  </Select>
{/*                   <Button
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className="flex items-center gap-2"
                  >
                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    Favorites
                  </Button> */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chants Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading chants...</div>
            </div>
          ) : chants.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Chants Available</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedFileType !== 'all' || showFavoritesOnly
                    ? "No chants match your current filters. Try adjusting your search criteria."
                    : "Your club hasn't uploaded any chants yet. Check back later for club traditions and songs."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chants.map((chant) => (
                <Card key={chant._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getFileTypeIcon(chant.fileType)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight">{chant.title}</CardTitle>
                          {/* Display club name prominently */}
                          {chant.club && (
                            <div className="mt-1">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {(chant.club as any).name || 'Unknown Club'}
                              </Badge>
                            </div>
                          )}
                          {chant.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {chant.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <Badge variant="secondary">
                          {chant.fileType}
                        </Badge>
{/*                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(chant._id)}
                          className="p-1 h-6 w-6"
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              favorites.has(chant._id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground hover:text-red-500'
                            }`} 
                          />
                        </Button> */}
{/*                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(chant)}
                          className="p-1 h-6 w-6"
                        >
                          <Share2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button> */}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Content Display */}
                    {chant.fileType === 'text' && chant.content && (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                          {chant.content}
                        </pre>
                      </div>
                    )}
                    
                    {chant.fileType === 'iframe' && chant.iframeUrl && (
                      <div className="space-y-3">
                        <div className="border rounded-lg overflow-hidden bg-muted/50">
                          <iframe
                            src={chant.iframeUrl}
                            width={chant.iframeWidth || '100%'}
                            height={chant.iframeHeight || '600px'}
                            className="w-full border-0"
                            style={{
                              minHeight: '400px',
                              display: 'block'
                            }}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            loading="lazy"
                            title={chant.title}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Embedded content from external source</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(chant.iframeUrl, '_blank')}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Open in new tab
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {chant.fileType === 'image' && chant.fileUrl && (
                      <div className="space-y-2">
                        <img 
                          src={chant.fileUrl} 
                          alt={chant.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {chant.fileType === 'audio' && chant.fileUrl && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAudioPlay(chant._id)}
                            className="flex-shrink-0"
                          >
                            {playingAudio === chant._id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{chant.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {chant.fileSize && formatFileSize(chant.fileSize)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(chant.fileUrl, '_blank')}
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {playingAudio === chant._id && (
                          <div className="space-y-2">
                            <audio 
                              controls 
                              className="w-full"
                              autoPlay
                              muted={isMuted}
                              onEnded={() => setPlayingAudio(null)}
                            >
                              <source src={chant.fileUrl} type={chant.mimeType} />
                              Your browser does not support the audio element.
                            </audio>
                            <div className="flex items-center gap-2 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMute}
                                className="p-1 h-6 w-6"
                              >
                                {isMuted ? (
                                  <VolumeX className="w-4 h-4" />
                                ) : (
                                  <Volume2 className="w-4 h-4" />
                                )}
                              </Button>
                              <span className="text-muted-foreground">
                                {isMuted ? 'Muted' : 'Volume: ' + Math.round(audioVolume * 100) + '%'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Tags */}
                    {chant.tags && chant.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex gap-1 flex-wrap">
                          {chant.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="truncate">{chant.createdBy.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(chant.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
