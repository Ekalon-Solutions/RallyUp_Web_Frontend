import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Calendar } from 'lucide-react';
import { VolunteerOpportunity } from '@/lib/api';

interface VolunteerOpportunitiesWidgetProps {
  opportunities: VolunteerOpportunity[];
  onViewAll: () => void;
  onSignUp: (opportunityId: string, timeSlotId: string) => void;
}

export function VolunteerOpportunitiesWidget({ 
  opportunities, 
  onViewAll, 
  onSignUp 
}: VolunteerOpportunitiesWidgetProps) {
  const openOpportunities = opportunities.filter(opp => opp.status === 'open').slice(0, 3);

  if (openOpportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Volunteer Opportunities
          </CardTitle>
          <CardDescription>Current volunteer needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">No volunteer opportunities available at the moment.</p>
            <Button variant="outline" onClick={onViewAll}>
              Check for Opportunities
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Volunteer Opportunities
        </CardTitle>
        <CardDescription>Current volunteer needs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {openOpportunities.map((opportunity) => (
            <div key={opportunity._id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{opportunity.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {opportunity.timeSlots.length} time slot{opportunity.timeSlots.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {opportunity.description}
              </p>
              
              <div className="space-y-2">
                {opportunity.timeSlots.slice(0, 2).map((slot) => (
                  <div key={slot._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{slot.volunteersAssigned.length}/{slot.volunteersNeeded}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSignUp(opportunity._id, slot._id)}
                      disabled={slot.volunteersAssigned.length >= slot.volunteersNeeded}
                      className="h-6 px-2 text-xs"
                    >
                      {slot.volunteersAssigned.length >= slot.volunteersNeeded ? 'Full' : 'Sign Up'}
                    </Button>
                  </div>
                ))}
                
                {opportunity.timeSlots.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{opportunity.timeSlots.length - 2} more time slots
                  </p>
                )}
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full" onClick={onViewAll}>
            View All Opportunities
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
