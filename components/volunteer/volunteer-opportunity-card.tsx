import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, UsersIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { VolunteerOpportunity } from '@/lib/api';

interface VolunteerOpportunityCardProps {
  opportunity: VolunteerOpportunity;
  onSignUp?: (opportunityId: string, timeSlotId: string) => void;
  onWithdraw?: (opportunityId: string, timeSlotId: string) => void;
  onEdit?: (opportunity: VolunteerOpportunity) => void;
  isAdmin?: boolean;
  currentVolunteerId?: string; // Add this to check if user is already signed up
}

const statusColors = {
  draft: 'bg-gray-500',
  open: 'bg-green-500',
  filled: 'bg-blue-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500',
};

export function VolunteerOpportunityCard({
  opportunity,
  onSignUp,
  onWithdraw,
  onEdit,
  isAdmin = false,
  currentVolunteerId,
}: VolunteerOpportunityCardProps) {
  const totalVolunteersNeeded = opportunity.timeSlots.reduce(
    (sum, slot) => sum + slot.volunteersNeeded,
    0
  );

  const totalVolunteersAssigned = opportunity.timeSlots.reduce(
    (sum, slot) => sum + slot.volunteersAssigned.length,
    0
  );

  // Helper function to check if current volunteer is signed up for a time slot
  const isSignedUpForTimeSlot = (slot: any) => {
    return currentVolunteerId && slot.volunteersAssigned.includes(currentVolunteerId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{opportunity.title}</CardTitle>
          <Badge className={statusColors[opportunity.status]}>
            {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
          </Badge>
        </div>
        <CardDescription>{opportunity.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {opportunity.date ? format(new Date(opportunity.date), 'MMMM d, yyyy') : 'Date not set'}
            </span>
          </div>

          <div className="space-y-2">
            {opportunity.timeSlots.map((slot) => (
              <div
                key={slot._id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  isSignedUpForTimeSlot(slot) 
                    ? 'border-green-500/50 bg-green-500/10 dark:bg-green-500/20' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {slot.volunteersAssigned.length} / {slot.volunteersNeeded}
                    </span>
                    {isSignedUpForTimeSlot(slot) && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-1" />
                    )}
                  </div>
                </div>
                {onSignUp && opportunity.status === 'open' && !isSignedUpForTimeSlot(slot) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSignUp(opportunity._id, slot._id)}
                    disabled={slot.volunteersAssigned.length >= slot.volunteersNeeded}
                    className={slot.volunteersAssigned.length >= slot.volunteersNeeded ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {slot.volunteersAssigned.length >= slot.volunteersNeeded ? 'Full' : 'Sign Up'}
                  </Button>
                )}
                
                {isSignedUpForTimeSlot(slot) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Already Signed Up
                    </Badge>
                    {onWithdraw && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onWithdraw(opportunity._id, slot._id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {opportunity.requiredSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {totalVolunteersAssigned} of {totalVolunteersNeeded} spots filled
            </span>
            {opportunity.notes && <span>Note: {opportunity.notes}</span>}
          </div>
        </div>
      </CardContent>
      {isAdmin && onEdit && (
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEdit(opportunity)}
          >
            Edit Opportunity
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
