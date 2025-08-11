"use client";
import React from 'react';
import { VolunteerOpportunityCard } from '@/components/volunteer/volunteer-opportunity-card';
import { VolunteerSignUpModal } from '@/components/volunteer/volunteer-signup-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { apiClient, VolunteerOpportunity, VolunteerProfile } from '@/lib/api';

import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/contexts/auth-context';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = React.useState<VolunteerOpportunity[]>([]);
  const [userPreferences, setUserPreferences] = React.useState<VolunteerProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('available');
  const { toast } = useToast();

  const fetchOpportunities = React.useCallback(async () => {
    try {
      const response = await apiClient.getVolunteerOpportunities();
      if (response.success && response.data) {
        setOpportunities(response.data?.opportunities || []);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch volunteer opportunities',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteer opportunities',
        variant: 'destructive',
      });
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSignUp = async (opportunityId: string, timeSlotId: string) => {
    try {
      const response = await apiClient.signUpForVolunteerOpportunity(opportunityId, timeSlotId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Successfully signed up for the volunteer opportunity',
        });
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to sign up for the volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign up for the volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async (opportunityId: string, timeSlotId: string) => {
    try {
      const response = await apiClient.withdrawFromVolunteerOpportunity(opportunityId, timeSlotId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Successfully withdrawn from the volunteer opportunity',
        });
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to withdraw from the volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to withdraw from the volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const handlePreferencesSubmit = async (preferences: VolunteerProfile) => {
    try {
      const response = await apiClient.updateVolunteerProfile(preferences);
      if (response.success) {
        setUserPreferences(preferences);
        setIsModalOpen(false);
        toast({
          title: 'Success',
          description: 'Successfully updated volunteer preferences',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update volunteer preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update volunteer preferences',
        variant: 'destructive',
      });
    }
  };

  const availableOpportunities = opportunities.filter(
    (opportunity) => opportunity.status === 'open'
  );

  const myOpportunities = opportunities.filter((opportunity) =>
    opportunity.timeSlots.some((slot) =>
      slot.volunteersAssigned.includes(user?._id || '')
    )
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            {userPreferences?.isVolunteer ? 'Update Preferences' : 'Become a Volunteer'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Opportunities</TabsTrigger>
            <TabsTrigger value="my-opportunities">My Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableOpportunities.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No volunteer opportunities available at the moment.
              </p>
            ) : (
              availableOpportunities.map((opportunity) => (
                <VolunteerOpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  onSignUp={handleSignUp}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="my-opportunities" className="space-y-4">
            {myOpportunities.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You haven't signed up for any volunteer opportunities yet.
              </p>
            ) : (
              myOpportunities.map((opportunity) => (
                <VolunteerOpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  onWithdraw={handleWithdraw}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <VolunteerSignUpModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handlePreferencesSubmit}
          initialPreferences={userPreferences || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
