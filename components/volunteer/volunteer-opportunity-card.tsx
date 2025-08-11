import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { VolunteerOpportunity } from '@/lib/api';

interface VolunteerOpportunityCardProps {
  opportunity: VolunteerOpportunity;
  onSignUp?: (opportunityId: string, timeSlotId: string) => void;
  onWithdraw?: (opportunityId: string, timeSlotId: string) => void;
  onEdit?: (opportunity: VolunteerOpportunity) => void;
  isAdmin?: boolean;
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
}: VolunteerOpportunityCardProps) {
  const totalVolunteersNeeded = opportunity.timeSlots.reduce(
    (sum, slot) => sum + slot.volunteersNeeded,
    0
  );

  const totalVolunteersAssigned = opportunity.timeSlots.reduce(
    (sum, slot) => sum + slot.volunteersAssigned.length,
    0
  );

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
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center space-x-4">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>
                      {slot.volunteersAssigned.length} / {slot.volunteersNeeded}
                    </span>
                  </div>
                </div>
                {onSignUp && opportunity.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSignUp(opportunity._id, slot._id)}
                    disabled={slot.volunteersAssigned.length >= slot.volunteersNeeded}
                  >
                    Sign Up
                  </Button>
                )}
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
