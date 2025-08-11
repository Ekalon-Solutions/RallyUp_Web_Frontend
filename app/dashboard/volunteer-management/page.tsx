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
import { apiClient, VolunteerOpportunity } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';

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
        <Button 
          type="button" 
          onClick={() => {
            console.log('Test button clicked');
            console.log('Form data:', formData);
            console.log('Club ID:', clubId);
          }}
          variant="secondary"
        >
          Test Form
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function VolunteerManagement() {
  const { user, logout } = useAuth();
  
  React.useEffect(() => {
    console.log('Current user:', user);
  }, [user]);
  const [opportunities, setOpportunities] = React.useState<VolunteerOpportunity[]>([]);
  const [volunteers, setVolunteers] = React.useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingOpportunity, setEditingOpportunity] = React.useState<VolunteerOpportunity | null>(null);
  const [activeTab, setActiveTab] = React.useState('opportunities');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { toast } = useToast();

  const clubId = React.useMemo(() => {
    if (user && 'club' in user && user.club && typeof user.club === 'object' && '_id' in user.club) {
      return user.club._id;
    }
    return null;
  }, [user]);

  const fetchOpportunities = React.useCallback(async () => {
    if (!clubId) {
      toast({
        title: 'Error',
        description: 'No club associated with your account. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.getVolunteerOpportunities({
        club: clubId,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      if (response.success && response.data) {
        console.log('Raw opportunities response:', response.data);
        // Handle both single object and array responses
        const opportunitiesData = response.data?.opportunities || response.data;
        console.log('Processed opportunities data:', opportunitiesData);
        const finalOpportunities = Array.isArray(opportunitiesData) ? opportunitiesData : [opportunitiesData];
        console.log('Final opportunities array:', finalOpportunities);
        setOpportunities(finalOpportunities);
      } else {
        console.error('Failed to fetch opportunities:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch volunteer opportunities',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteer opportunities',
        variant: 'destructive',
      });
    }
  }, [toast, clubId, statusFilter]);

  const fetchVolunteers = React.useCallback(async () => {
    if (!clubId) {
      toast({
        title: 'Error',
        description: 'No club associated with your account. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.getVolunteers({
        club: clubId
      });
      
      if (response.success && response.data) {
        setVolunteers(response.data.volunteers || []);
      } else {
        console.error('Failed to fetch volunteers:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch volunteers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteers',
        variant: 'destructive',
      });
    }
  }, [toast, clubId]);

  React.useEffect(() => {
    fetchOpportunities();
    fetchVolunteers();
  }, [fetchOpportunities, fetchVolunteers]);

  const handleCreateOpportunity = async (opportunity: any) => {
    console.log('handleCreateOpportunity called with:', opportunity);
    try {
      const response = await apiClient.createVolunteerOpportunity(opportunity);
      if (response.success) {
        console.log('API response:', response);
        setIsCreateModalOpen(false);
        fetchOpportunities();
        toast({
          title: 'Success',
          description: 'Successfully created volunteer opportunity',
        });
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
  };

  const handleEditOpportunity = (opportunity: VolunteerOpportunity) => {
    setEditingOpportunity(opportunity);
    setIsEditModalOpen(true);
  };

  const handleUpdateOpportunity = async (updatedData: any) => {
    if (!editingOpportunity) return;
    
    try {
      const response = await apiClient.updateVolunteerOpportunity(editingOpportunity._id, {
        ...updatedData,
        timeSlots: [{
          startTime: updatedData.startTime,
          endTime: updatedData.endTime,
          volunteersNeeded: updatedData.volunteersNeeded,
          volunteersAssigned: editingOpportunity.timeSlots[0]?.volunteersAssigned || []
        }]
      });
      
      if (response.success) {
        setIsEditModalOpen(false);
        setEditingOpportunity(null);
        fetchOpportunities();
        toast({
          title: 'Success',
          description: 'Successfully updated volunteer opportunity',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    try {
      const response = await apiClient.deleteVolunteerOpportunity(id);
      if (response.success) {
        fetchOpportunities();
        toast({
          title: 'Success',
          description: 'Successfully deleted volunteer opportunity',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredVolunteers = volunteers.filter((volunteer) =>
    volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          {/* Debug log */}
          {(() => { console.log('Rendering opportunities:', filteredOpportunities); })()}
          {filteredOpportunities.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No volunteer opportunities found.
            </p>
          ) : (
            filteredOpportunities.map((opportunity) => {
              console.log('Rendering opportunity:', opportunity);
              return (
                <VolunteerOpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  onEdit={handleEditOpportunity}
                  isAdmin
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="volunteers">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVolunteers.map((volunteer) => (
              <div
                key={volunteer._id}
                className="rounded-lg border p-4 shadow-sm"
              >
                <h3 className="text-lg font-medium">{volunteer.name}</h3>
                <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Skills</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {volunteer.volunteering.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-secondary px-2 py-1 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Availability</h4>
                  <div className="mt-1 space-y-1 text-sm">
                    {volunteer.volunteering.availability.weekdays && <p>Weekdays</p>}
                    {volunteer.volunteering.availability.weekends && <p>Weekends</p>}
                    {volunteer.volunteering.availability.evenings && <p>Evenings</p>}
                  </div>
                </div>
              </div>
            ))}
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
              onSubmit={handleUpdateOpportunity}
              onCancel={() => setIsEditModalOpen(false)}
              initialData={editingOpportunity}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
