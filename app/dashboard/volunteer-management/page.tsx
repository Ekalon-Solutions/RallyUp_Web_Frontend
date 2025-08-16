"use client";
import React from 'react';
import { VolunteerOpportunityCard } from '@/components/volunteer/volunteer-opportunity-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, VolunteerOpportunity, Volunteer } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Calendar, Clock, MapPin, Star, XCircle } from 'lucide-react';
import { VolunteerDetailsModal } from '@/components/modals/volunteer-details-modal';
import { AssignVolunteerModal } from '@/components/modals/assign-volunteer-modal';
import { UnassignVolunteerModal } from '@/components/modals/unassign-volunteer-modal';

interface OpportunityFormProps {
  onSubmit: (opportunity: any) => void;
  onCancel: () => void;
  initialData?: VolunteerOpportunity;
  mode: 'create' | 'edit';
}

function OpportunityForm({ onSubmit, onCancel, initialData, mode }: OpportunityFormProps) {
  const { user } = useAuth();
  const [clubId, setClubId] = React.useState<string>('');
  
  React.useEffect(() => {
    // Get the club ID from the user object
    if (user && 'club' in user && user.club && typeof user.club === 'object' && '_id' in user.club) {
      setClubId(user.club._id);
    }
  }, [user]);

  const [formData, setFormData] = React.useState(() => {
    if (initialData) {
      const timeSlot = initialData.timeSlots[0] || {};
      return {
        title: initialData.title || '',
        description: initialData.description || '',
        requiredSkills: initialData.requiredSkills.join(', ') || '',
        date: new Date().toISOString().split('T')[0],
        startTime: timeSlot.startTime || '',
        endTime: timeSlot.endTime || '',
        volunteersNeeded: timeSlot.volunteersNeeded || 1,
        notes: initialData.notes || '',
        status: initialData.status || 'draft'
      };
    }
    return {
      title: '',
      description: '',
      requiredSkills: '',
      date: '',
      startTime: '',
      endTime: '',
      volunteersNeeded: 1,
      notes: '',
      status: 'draft'
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Club ID:', clubId);
    
    if (!clubId) {
      alert('Club information not available. Please contact your administrator.');
      return;
    }
    
    const opportunity = {
      ...formData,
      club: clubId,
      requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
      timeSlots: [{
        startTime: formData.startTime,
        endTime: formData.endTime,
        volunteersNeeded: formData.volunteersNeeded,
        volunteersAssigned: []
      }]
    };
    console.log('Submitting opportunity:', opportunity);
    onSubmit(opportunity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {clubId && (
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Club</Label>
          <p className="text-sm text-muted-foreground">
            {user && 'club' in user && user.club && typeof user.club === 'object' && '_id' in user.club && 'name' in user.club ? user.club.name : 'Club'}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Event Setup Help"
          />
        </div>
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          placeholder="Describe the volunteer opportunity..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="volunteersNeeded">Volunteers Needed *</Label>
          <Input
            id="volunteersNeeded"
            type="number"
            min="1"
            value={formData.volunteersNeeded}
            onChange={(e) => setFormData({ ...formData, volunteersNeeded: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="requiredSkills">Required Skills</Label>
          <Input
            id="requiredSkills"
            value={formData.requiredSkills}
            onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
            placeholder="e.g., Event planning, Customer service"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or requirements..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status || 'draft'} 
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {mode === 'create' ? 'Create' : 'Update'} Opportunity
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function VolunteerManagementPage() {
  const { user, logout } = useAuth();
  
  React.useEffect(() => {
    console.log('Current user:', user);
  }, [user]);
  const [opportunities, setOpportunities] = React.useState<VolunteerOpportunity[]>([]);
  const [volunteers, setVolunteers] = React.useState<Volunteer[]>([]);
  const [volunteerSignups, setVolunteerSignups] = React.useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingOpportunity, setEditingOpportunity] = React.useState<VolunteerOpportunity | null>(null);
  const [activeTab, setActiveTab] = React.useState('opportunities');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [loading, setLoading] = React.useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<VolunteerOpportunity | null>(null);
  const [opportunitySignups, setOpportunitySignups] = React.useState<any[]>([]);
  const [showSignupsModal, setShowSignupsModal] = React.useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<Volunteer | null>(null);
  const [showVolunteerDetailsModal, setShowVolunteerDetailsModal] = React.useState(false);
  
  // Assignment modal states
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [showUnassignModal, setShowUnassignModal] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | null>(null);
  const { toast } = useToast();

  const clubId = React.useMemo(() => {
    if (user && 'club' in user && user.club && typeof user.club === 'object' && '_id' in user.club) {
      return user.club._id;
    }
    return null;
  }, [user]);

  const fetchOpportunities = React.useCallback(async () => {
    if (!user || !('club' in user) || !user.club) return;
    
    try {
      const clubId = user.club._id;
      const response = await apiClient.getVolunteerOpportunities({ club: clubId });
      
      if (response.success) {
        const opportunities = response.data?.opportunities || [];
        setOpportunities(opportunities);
      } else {
        console.error('Failed to fetch opportunities:', response.error);
        setOpportunities([]);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setOpportunities([]);
    }
  }, [user]);

  const fetchVolunteers = React.useCallback(async () => {
    if (!user || !('club' in user) || !user.club) return;
    
    try {
      const clubId = user.club._id;
      const response = await apiClient.getVolunteers({ club: clubId });
      
      if (response.success) {
        setVolunteers(response.data || []);
      } else {
        console.error('Failed to fetch volunteers:', response.error);
        setVolunteers([]);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setVolunteers([]);
    }
  }, [user]);

  const fetchVolunteerSignups = React.useCallback(async () => {
    if (!user || !('club' in user) || !user.club) return;
    
    try {
      setLoading(true);
      const clubId = user.club._id;
      
      // Fetch all opportunities for the club
      const opportunitiesResponse = await apiClient.getVolunteerOpportunities({ club: clubId });
      if (!opportunitiesResponse.success) return;
      
      const clubOpportunities = opportunitiesResponse.data?.opportunities || [];
      
      // Collect all signups from all opportunities
      const allSignups: any[] = [];
      
      for (const opportunity of clubOpportunities) {
        if (opportunity.timeSlots) {
          for (const timeSlot of opportunity.timeSlots) {
            if (timeSlot.volunteersAssigned && timeSlot.volunteersAssigned.length > 0) {
              // For now, we'll just show the volunteer IDs since we don't have a getUserById method
              // In a real implementation, you'd want to fetch volunteer details
              for (const volunteerId of timeSlot.volunteersAssigned) {
                allSignups.push({
                  opportunityId: opportunity._id,
                  opportunityTitle: opportunity.title,
                  timeSlotId: timeSlot._id,
                  startTime: timeSlot.startTime,
                  endTime: timeSlot.endTime,
                  date: opportunity.createdAt, // Use createdAt instead of date
                  volunteerId: volunteerId,
                  status: 'confirmed' // Default status
                });
              }
            }
          }
        }
      }
      
      setVolunteerSignups(allSignups);
    } catch (error) {
      console.error('Error fetching volunteer signups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchOpportunitySignups = React.useCallback(async (opportunityId: string) => {
    try {
      const response = await apiClient.getVolunteerSignupsForOpportunity(opportunityId);
      if (response.success) {
        setOpportunitySignups(response.data || []);
      } else {
        console.error('Failed to fetch opportunity signups:', response.error);
        setOpportunitySignups([]);
      }
    } catch (error) {
      console.error('Error fetching opportunity signups:', error);
      setOpportunitySignups([]);
    }
  }, []);

  const handleViewSignups = React.useCallback((opportunity: VolunteerOpportunity) => {
    setSelectedOpportunity(opportunity);
    fetchOpportunitySignups(opportunity._id);
    setShowSignupsModal(true);
  }, [fetchOpportunitySignups]);

  React.useEffect(() => {
    fetchOpportunities();
    fetchVolunteers();
    // Don't call fetchVolunteerSignups here to avoid infinite loop
  }, [fetchOpportunities, fetchVolunteers]);

  // Separate useEffect for volunteer signups
  React.useEffect(() => {
    if (user && 'club' in user && user.club) {
      fetchVolunteerSignups();
    }
  }, [user, fetchVolunteerSignups]); // Only depend on user changes

  const handleCreateOpportunity = React.useCallback(async (opportunity: any) => {
    if (!user || !('club' in user) || !user.club) return;
    
    try {
      const response = await apiClient.createVolunteerOpportunity(opportunity);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Volunteer opportunity created successfully',
        });
        setIsCreateModalOpen(false);
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to create volunteer opportunity',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchOpportunities]);

  const handleEditOpportunity = React.useCallback(async (opportunity: any) => {
    if (!editingOpportunity) return;
    
    try {
      const response = await apiClient.updateVolunteerOpportunity(editingOpportunity._id, opportunity);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Volunteer opportunity updated successfully',
        });
        setIsEditModalOpen(false);
        setEditingOpportunity(null);
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update volunteer opportunity',
        variant: 'destructive',
      });
    }
  }, [editingOpportunity, toast, fetchOpportunities]);

  const handleDeleteOpportunity = React.useCallback(async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      const response = await apiClient.deleteVolunteerOpportunity(opportunityId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Volunteer opportunity deleted successfully',
        });
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete volunteer opportunity',
        variant: 'destructive',
      });
    }
  }, [toast, fetchOpportunities]);

  const filteredOpportunities = React.useMemo(() => opportunities.filter((opportunity) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [opportunities, searchTerm, statusFilter]);

  const filteredVolunteers = React.useMemo(() => volunteers.filter((volunteer) =>
    volunteer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [volunteers, searchTerm]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Volunteer Management</h1>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Opportunity
          </Button>
        </div>

        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="signups">Volunteer Signups</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Volunteer Opportunities</h3>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Opportunity
                </Button>
              </div>

              {/* Opportunities List */}
              <div className="space-y-4">
                {filteredOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No volunteer opportunities found.</p>
                  </div>
                ) : (
                  filteredOpportunities.map((opportunity) => (
                    <div key={opportunity._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{opportunity.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Badge variant={opportunity.status === 'open' ? 'default' : 'secondary'}>
                                {opportunity.status}
                              </Badge>
                            </span>
                            <span className="text-muted-foreground">
                              {opportunity.timeSlots.length} time slot{opportunity.timeSlots.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-muted-foreground">
                              Created: {new Date(opportunity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity(opportunity);
                              setShowSignupsModal(true);
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Signups
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity(opportunity);
                              // Show time slot selector first
                              if (opportunity.timeSlots.length === 1) {
                                setSelectedTimeSlot(opportunity.timeSlots[0]._id);
                                setShowAssignModal(true);
                              } else {
                                // For multiple time slots, we'll need to show a selector
                                // For now, just show the first one
                                setSelectedTimeSlot(opportunity.timeSlots[0]._id);
                                setShowAssignModal(true);
                              }
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Assign Volunteers
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity(opportunity);
                              // Show time slot selector first
                              if (opportunity.timeSlots.length === 1) {
                                setSelectedTimeSlot(opportunity.timeSlots[0]._id);
                                setShowUnassignModal(true);
                              } else {
                                // For multiple time slots, we'll need to show a selector
                                // For now, just show the first one
                                setSelectedTimeSlot(opportunity.timeSlots[0]._id);
                                setShowUnassignModal(true);
                              }
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Unassign Volunteers
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingOpportunity(opportunity);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteOpportunity(opportunity._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Time Slots with Signup Information */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium">Time Slots & Signups</h5>
                        {opportunity.timeSlots.map((timeSlot) => {
                          const signupCount = timeSlot.volunteersAssigned.length;
                          const isFilled = signupCount >= timeSlot.volunteersNeeded;
                          
                          return (
                            <div key={timeSlot._id} className="border-l-4 border-gray-200 pl-3 py-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {timeSlot.startTime} - {timeSlot.endTime}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {signupCount} / {timeSlot.volunteersNeeded} volunteers
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={isFilled ? "default" : "secondary"}>
                                    {isFilled ? "Filled" : "Open"}
                                  </Badge>
                                  {signupCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {signupCount} signed up
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show volunteer details if any are signed up */}
                              {signupCount > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Volunteers:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {timeSlot.volunteersAssigned.map((volunteerId) => {
                                      // Find the volunteer details from the volunteers list
                                      const volunteer = volunteers.find(v => v._id === volunteerId);
                                      return volunteer ? (
                                        <span
                                          key={volunteerId}
                                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1"
                                          title={`${volunteer.user.name} - ${volunteer.user.email}`}
                                        >
                                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                          {volunteer.user.name}
                                        </span>
                                      ) : (
                                        <span
                                          key={volunteerId}
                                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                        >
                                          Loading...
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Required Skills</h5>
                          <div className="flex flex-wrap gap-1">
                            {opportunity.requiredSkills.map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="volunteers">
            <div className="space-y-4">
              {/* Volunteer Statistics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold">{volunteers.length}</div>
                  <div className="text-sm text-muted-foreground">Total Volunteers</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {volunteers.filter(v => v.status === 'available').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {volunteers.filter(v => v.availability.weekends).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Weekend Available</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {volunteers.filter(v => v.availability.evenings).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Evening Available</div>
                </div>
              </div>

              {/* Volunteer List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Volunteer Directory</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await apiClient.debugVolunteers();
                          console.log('🔍 Debug volunteers response:', response);
                          if (response.success) {
                            console.log('🔍 Total volunteers:', response.data.total);
                            console.log('🔍 Volunteers with filters:', response.data.withFilters);
                            console.log('🔍 All volunteers:', response.data.allVolunteers);
                            console.log('🔍 Filtered volunteers:', response.data.filteredVolunteers);
                          }
                        } catch (error) {
                          console.error('🔍 Debug error:', error);
                        }
                      }}
                    >
                      Debug Volunteers
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      Showing {filteredVolunteers.length} of {volunteers.length} volunteers
                    </div>
                  </div>
                </div>
                
                {filteredVolunteers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No volunteers found matching your search criteria.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredVolunteers.map((volunteer) => (
                      <div
                        key={volunteer._id}
                        className="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium">{volunteer.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{volunteer.user.email}</p>
                            <p className="text-sm text-muted-foreground">{volunteer.user.countryCode} {volunteer.user.phoneNumber}</p>
                          </div>
                          <Badge variant={volunteer.isActive ? "default" : "secondary"}>
                            {volunteer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {volunteer.skills && volunteer.skills.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {volunteer.skills.map((skill: string) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-secondary px-2 py-1 text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {volunteer.interests && volunteer.interests.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-1">
                              {volunteer.interests.map((interest: string) => (
                                <span
                                  key={interest}
                                  className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2">Status & Experience</h4>
                          <div className="space-y-2">
                            <Badge variant="outline" className="text-xs">
                              {volunteer.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {volunteer.experience.level} ({volunteer.experience.yearsOfExperience} years)
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVolunteer(volunteer);
                              setShowVolunteerDetailsModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Volunteer Signups Tab */}
          <TabsContent value="signups">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Volunteer Signups</h3>
                <Button onClick={fetchVolunteerSignups} variant="outline" size="sm">
                  Refresh Signups
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading volunteer signups...</p>
                </div>
              ) : volunteerSignups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No volunteer signups found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Volunteers will appear here once they sign up for opportunities.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Signups Summary */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <div className="text-2xl font-bold">{volunteerSignups.length}</div>
                      <div className="text-sm text-muted-foreground">Total Signups</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {volunteerSignups.filter(s => s.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Confirmed</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {new Set(volunteerSignups.map(s => s.volunteerId)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Unique Volunteers</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Set(volunteerSignups.map(s => s.opportunityId)).size}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Opportunities</div>
                    </div>
                  </div>

                  {/* Signups List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Recent Signups</h4>
                    {volunteerSignups.map((signup, index) => (
                      <div key={`${signup.opportunityId}-${signup.timeSlotId}-${signup.volunteerId}`} 
                           className="border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            {(() => {
                              const volunteer = volunteers.find(v => v._id === signup.volunteerId);
                              return volunteer ? (
                                <>
                                  <h5 className="font-medium text-lg">{volunteer.user.name}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {volunteer.user.email}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {volunteer.user.countryCode} {volunteer.user.phoneNumber}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h5 className="font-medium text-lg">Volunteer ID: {signup.volunteerId.substring(0, 8)}...</h5>
                                  <p className="text-sm text-muted-foreground">
                                    Loading volunteer details...
                                  </p>
                                </>
                              );
                            })()}
                            <p className="text-sm text-muted-foreground mt-2">
                              Status: {signup.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="mb-2">
                              {signup.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Date: {new Date(signup.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h6 className="text-sm font-medium mb-2">Opportunity Details</h6>
                            <p className="text-sm font-medium">{signup.opportunityTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {signup.startTime} - {signup.endTime}
                            </p>
                          </div>
                          
                          <div>
                            <h6 className="text-sm font-medium mb-2">Volunteer Skills</h6>
                            {(() => {
                              const volunteer = volunteers.find(v => v._id === signup.volunteerId);
                              return volunteer && volunteer.skills && volunteer.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {volunteer.skills.slice(0, 3).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {volunteer.skills.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{volunteer.skills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No skills listed</p>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog 
          open={isCreateModalOpen} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange called with:', open);
            setIsCreateModalOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Volunteer Opportunity</DialogTitle>
              <DialogDescription>
                Create a new volunteer opportunity for your organization.
              </DialogDescription>
            </DialogHeader>
            
            <OpportunityForm 
              onSubmit={handleCreateOpportunity}
              onCancel={() => setIsCreateModalOpen(false)}
              mode="create"
            />
          </DialogContent>
        </Dialog>

        <Dialog 
          open={isEditModalOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingOpportunity(null);
            }
            setIsEditModalOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Volunteer Opportunity</DialogTitle>
              <DialogDescription>
                Update the details of this volunteer opportunity.
              </DialogDescription>
            </DialogHeader>
            
            {editingOpportunity && (
              <OpportunityForm 
                onSubmit={handleEditOpportunity}
                onCancel={() => setIsEditModalOpen(false)}
                initialData={editingOpportunity}
                mode="edit"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Volunteer Signups Modal */}
        {showSignupsModal && selectedOpportunity && (
          <Dialog open={showSignupsModal} onOpenChange={setShowSignupsModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Volunteer Signups - {selectedOpportunity.title}</DialogTitle>
                <DialogDescription>
                  View all volunteers who have signed up for this opportunity
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {opportunitySignups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No volunteers have signed up for this opportunity yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Signups Summary */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xl font-bold">{opportunitySignups.length}</div>
                        <div className="text-sm text-muted-foreground">Total Signups</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xl font-bold text-green-600">
                          {opportunitySignups.filter(s => s.status === 'confirmed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Confirmed</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xl font-bold text-blue-600">
                          {new Set(opportunitySignups.map(s => s.volunteer._id)).size}
                        </div>
                        <div className="text-sm text-muted-foreground">Unique Volunteers</div>
                      </div>
                    </div>

                    {/* Signups List */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-medium">Volunteer Details</h4>
                      {opportunitySignups.map((signup, index) => (
                        <div key={`${signup.timeSlotId}-${signup.volunteer._id}`} 
                             className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-lg">{signup.volunteer.name}</h5>
                              <p className="text-sm text-muted-foreground">{signup.volunteer.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {signup.volunteer.countryCode} {signup.volunteer.phoneNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="mb-2">
                                {signup.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {new Date(signup.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h6 className="text-sm font-medium mb-2">Time Slot</h6>
                              <p className="text-sm">
                                {signup.startTime} - {signup.endTime}
                              </p>
                            </div>
                            
                            <div>
                              <h6 className="text-sm font-medium mb-2">Volunteer Skills</h6>
                              {signup.volunteer.volunteering?.skills && signup.volunteer.volunteering.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {signup.volunteer.volunteering.skills.map((skill: string) => (
                                    <span key={skill} className="text-xs bg-secondary px-2 py-1 rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No skills specified</p>
                              )}
                            </div>
                          </div>

                          {signup.volunteer.volunteering?.notes && (
                            <div className="mt-3">
                              <h6 className="text-sm font-medium mb-2">Volunteer Notes</h6>
                              <p className="text-sm text-muted-foreground">{signup.volunteer.volunteering.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSignupsModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Volunteer Details Modal */}
        <VolunteerDetailsModal
          volunteer={selectedVolunteer}
          isOpen={showVolunteerDetailsModal}
          onClose={() => {
            setShowVolunteerDetailsModal(false);
            setSelectedVolunteer(null);
          }}
        />

        {/* Assignment Modals */}
        <AssignVolunteerModal
          opportunity={selectedOpportunity}
          timeSlotId={selectedTimeSlot}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTimeSlot(null);
          }}
          onVolunteerAssigned={() => {
            fetchVolunteers();
            fetchOpportunities(); // Refresh opportunities to show updated assignments
          }}
        />

        <UnassignVolunteerModal
          opportunity={selectedOpportunity}
          timeSlotId={selectedTimeSlot}
          isOpen={showUnassignModal}
          onClose={() => {
            setShowUnassignModal(false);
            setSelectedTimeSlot(null);
          }}
          onVolunteerUnassigned={() => {
            fetchVolunteers();
            fetchOpportunities(); // Refresh opportunities to show updated assignments
          }}
        />
      </div>
    </DashboardLayout>
  );
}
