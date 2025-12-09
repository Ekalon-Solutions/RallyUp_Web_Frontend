import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volunteer, VolunteerOpportunity } from '@/lib/api';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Clock, 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle,
  Search,
  Filter
} from 'lucide-react';

interface AssignVolunteerModalProps {
  opportunity: VolunteerOpportunity | null;
  timeSlotId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onVolunteerAssigned: () => void;
}

export function AssignVolunteerModal({ 
  opportunity, 
  timeSlotId, 
  isOpen, 
  onClose, 
  onVolunteerAssigned 
}: AssignVolunteerModalProps) {
  const [availableVolunteers, setAvailableVolunteers] = React.useState<Volunteer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [skillFilter, setSkillFilter] = React.useState<string>('all');
  const [experienceFilter, setExperienceFilter] = React.useState<string>('all');
  const [selectedVolunteer, setSelectedVolunteer] = React.useState<string>('');
  const [notes, setNotes] = React.useState('');
  const [assigning, setAssigning] = React.useState(false);
  const { toast } = useToast();

  const timeSlot = opportunity?.timeSlots.find(slot => slot._id === timeSlotId);

  const fetchAvailableVolunteers = React.useCallback(async () => {
    if (!opportunity || !timeSlotId) return;
    
    // // console.log('🔍 Frontend: Fetching volunteers for opportunity:', opportunity._id, 'timeSlot:', timeSlotId);
    
    try {
      setLoading(true);
      
      // Use the same working logic as Volunteer Directory - get all volunteers for the club
      const response = await apiClient.getVolunteers({ 
        club: opportunity.club 
      });
      
      // // console.log('🔍 Frontend: API response:', response);
      
      if (response.success) {
        const allVolunteers = response.data || [];
        // // console.log('🔍 Frontend: Received all volunteers:', allVolunteers.length, allVolunteers);
        
        // Filter out volunteers already assigned to this time slot
        const availableVolunteers = allVolunteers.filter(volunteer => 
          !timeSlot?.volunteersAssigned.includes(volunteer._id)
        );
        
        // // console.log('🔍 Frontend: Available volunteers after filtering assigned:', availableVolunteers.length);
        setAvailableVolunteers(availableVolunteers);
      } else {
        // // console.log('🔍 Frontend: API error:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch available volunteers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // // console.error('❌ Frontend: Error fetching available volunteers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available volunteers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [opportunity, timeSlotId, toast]);

  React.useEffect(() => {
    if (isOpen && opportunity && timeSlotId) {
      fetchAvailableVolunteers();
    }
  }, [isOpen, opportunity, timeSlotId, fetchAvailableVolunteers]);

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer || !opportunity || !timeSlotId) return;
    
    try {
      setAssigning(true);
      const response = await apiClient.assignVolunteerToOpportunity({
        opportunityId: opportunity._id,
        timeSlotId: timeSlotId,
        volunteerId: selectedVolunteer,
        notes: notes.trim() || undefined
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Volunteer assigned successfully',
        });
        onVolunteerAssigned();
        onClose();
        setSelectedVolunteer('');
        setNotes('');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to assign volunteer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // // console.error('Error assigning volunteer:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign volunteer',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredVolunteers = React.useMemo(() => {
    let filtered = availableVolunteers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(volunteer =>
        volunteer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Skill filter
    if (skillFilter !== 'all') {
      filtered = filtered.filter(volunteer =>
        volunteer.skills.includes(skillFilter)
      );
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(volunteer =>
        volunteer.experience.level === experienceFilter
      );
    }

    return filtered;
  }, [availableVolunteers, searchTerm, skillFilter, experienceFilter]);

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-yellow-100 text-yellow-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      case 'on-assignment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!opportunity || !timeSlot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Volunteer to Opportunity
          </DialogTitle>
          <DialogDescription>
            Assign a volunteer to "{opportunity.title}" - {timeSlot.startTime} to {timeSlot.endTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Opportunity Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Title:</span> {opportunity.title}
              </div>
              <div>
                <span className="font-medium">Time:</span> {timeSlot.startTime} - {timeSlot.endTime}
              </div>
              <div>
                <span className="font-medium">Volunteers:</span> {timeSlot.volunteersAssigned.length} / {timeSlot.volunteersNeeded}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant={timeSlot.volunteersAssigned.length >= timeSlot.volunteersNeeded ? "default" : "secondary"} className="ml-2">
                  {timeSlot.volunteersAssigned.length >= timeSlot.volunteersNeeded ? "Filled" : "Open"}
                </Badge>
              </div>
            </div>
            {opportunity.requiredSkills.length > 0 && (
              <div className="mt-2">
                <span className="font-medium text-sm">Required Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {opportunity.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Available Volunteers</h3>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Volunteers</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="skill-filter">Filter by Skill</Label>
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All skills</SelectItem>
                    {opportunity.requiredSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="experience-filter">Filter by Experience</Label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredVolunteers.length} of {availableVolunteers.length} available volunteers
            </div>
          </div>

          {/* Volunteers List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading available volunteers...</p>
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No volunteers available matching your criteria.</p>
              </div>
            ) : (
              filteredVolunteers.map((volunteer) => (
                <div
                  key={volunteer._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedVolunteer === volunteer._id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVolunteer(volunteer._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{volunteer.user.name}</h4>
                        <Badge className={getStatusColor(volunteer.status)}>
                          {volunteer.status}
                        </Badge>
                        <Badge className={getExperienceColor(volunteer.experience.level)}>
                          {volunteer.experience.level}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {volunteer.user.email} • {volunteer.user.countryCode} {volunteer.user.phone_number}
                      </p>
                      
                      <div className="space-y-2">
                        {volunteer.skills.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {volunteer.skills.map((skill) => (
                                <Badge 
                                  key={skill} 
                                  variant={opportunity.requiredSkills.includes(skill) ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {skill}
                                  {opportunity.requiredSkills.includes(skill) && (
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Max {volunteer.preferences.maxHoursPerWeek} hrs/week</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{volunteer.preferences.locationPreference}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                                      <div className="flex items-center gap-2">
                    {selectedVolunteer === volunteer._id ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />
                    )}
                  </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Assignment Form */}
          {selectedVolunteer && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Assignment Details</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this assignment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignVolunteer}
                    disabled={assigning}
                    className="flex-1"
                  >
                    {assigning ? 'Assigning...' : 'Assign Volunteer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVolunteer('')}
                  >
                    Cancel Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
