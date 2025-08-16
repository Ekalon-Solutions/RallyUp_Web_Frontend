import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VolunteerOpportunity, Volunteer } from '@/lib/api';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Clock, 
  AlertTriangle,
  XCircle,
  Mail,
  Phone
} from 'lucide-react';

interface UnassignVolunteerModalProps {
  opportunity: VolunteerOpportunity | null;
  timeSlotId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onVolunteerUnassigned: () => void;
}

export function UnassignVolunteerModal({ 
  opportunity, 
  timeSlotId, 
  isOpen, 
  onClose, 
  onVolunteerUnassigned 
}: UnassignVolunteerModalProps) {
  const [unassigning, setUnassigning] = React.useState(false);
  const [assignedVolunteers, setAssignedVolunteers] = React.useState<Volunteer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const timeSlot = opportunity?.timeSlots.find(slot => slot._id === timeSlotId);

  // Fetch volunteer details for assigned volunteers
  // Since volunteersAssigned contains volunteer IDs, we need to find the volunteer documents that have those IDs
  const fetchAssignedVolunteers = React.useCallback(async () => {
    if (!timeSlot || timeSlot.volunteersAssigned.length === 0) {
      setAssignedVolunteers([]);
      return;
    }

    try {
      setLoading(true);
      
      // Get all volunteers for the club (this already has populated user details)
      const response = await apiClient.getVolunteers({ 
        club: opportunity?.club 
      });
      
      if (response.success && response.data) {
        // Find volunteers whose _id matches the IDs in volunteersAssigned
        const volunteers = response.data.filter(volunteer => 
          timeSlot.volunteersAssigned.includes(volunteer._id)
        );
        
        console.log('🔍 Found assigned volunteers:', volunteers.length);
        setAssignedVolunteers(volunteers);
      } else {
        console.error('Failed to fetch volunteers:', response.error);
        setAssignedVolunteers([]);
      }
    } catch (error) {
      console.error('Error fetching assigned volunteers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteer details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [timeSlot, opportunity?.club, toast]);

  React.useEffect(() => {
    if (isOpen && timeSlot) {
      fetchAssignedVolunteers();
    }
  }, [isOpen, timeSlot, fetchAssignedVolunteers]);

  const handleUnassignVolunteer = async (userId: string) => {
    if (!opportunity || !timeSlotId) return;
    
    try {
      setUnassigning(true);
      const response = await apiClient.unassignVolunteerFromOpportunity({
        opportunityId: opportunity._id,
        timeSlotId: timeSlotId,
        volunteerId: userId // This is the user ID
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Volunteer unassigned successfully',
        });
        onVolunteerUnassigned();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to unassign volunteer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error unassigning volunteer:', error);
      toast({
        title: 'Error',
        description: 'Failed to unassign volunteer',
        variant: 'destructive',
      });
    } finally {
      setUnassigning(false);
    }
  };

  if (!opportunity || !timeSlot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Unassign Volunteers
          </DialogTitle>
          <DialogDescription>
            Remove volunteers from "{opportunity.title}" - {timeSlot.startTime} to {timeSlot.endTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Slot Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Time Slot Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Time:</span> {timeSlot.startTime} - {timeSlot.endTime}
              </div>
              <div>
                <span className="font-medium">Volunteers:</span> {timeSlot.volunteersAssigned.length} / {timeSlot.volunteersNeeded}
              </div>
            </div>
          </div>

          {/* Assigned Volunteers */}
          <div className="space-y-3">
            <h3 className="font-semibold">Currently Assigned Volunteers</h3>
            
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-muted-foreground">Loading assigned volunteers...</p>
              </div>
            ) : timeSlot.volunteersAssigned.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No volunteers currently assigned to this time slot.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedVolunteers.map((volunteer) => (
                  <div key={volunteer._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{volunteer.user.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {volunteer.user.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {volunteer.user.countryCode} {volunteer.user.phoneNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Skills */}
                        {volunteer.skills && volunteer.skills.length > 0 && (
                          <div className="ml-13 mb-2">
                            <span className="text-sm font-medium">Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {volunteer.skills.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Status and Experience */}
                        <div className="ml-13 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {volunteer.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {volunteer.experience.level} ({volunteer.experience.yearsOfExperience} years)
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnassignVolunteer(volunteer.user._id)}
                        disabled={unassigning}
                        className="ml-4"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Unassign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          {timeSlot.volunteersAssigned.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Warning</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Unassigning volunteers will remove them from this opportunity. 
                    Make sure to notify them about the change.
                  </p>
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
