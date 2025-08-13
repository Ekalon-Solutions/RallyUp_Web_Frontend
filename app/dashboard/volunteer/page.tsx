"use client";
import React from 'react';
import type { Club } from '@/lib/api';
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
    console.log('🔍 Starting to fetch opportunities...');
    try {
      // Get user's profile to get club info
      console.log('📱 Fetching user profile...');
      const userProfileResponse = await apiClient.userProfile();
      console.log('👤 User profile response:', {
        success: userProfileResponse.success,
        hasData: !!userProfileResponse.data,
        hasClub: !!userProfileResponse.data?.club,
        userData: userProfileResponse.data,
      });
      
      if (!userProfileResponse.success || !userProfileResponse.data?.club) {
        console.log('❌ No club found in user profile');
        setOpportunities([]);
        toast({
          title: 'No Club Access',
          description: 'You need to be a member of a club to see volunteer opportunities',
          variant: 'default',
        });
        return;
      }

      const clubId = userProfileResponse.data.club._id;
      console.log('🏢 Found club ID:', clubId);
      console.log('🏢 Club details:', userProfileResponse.data.club);
      
      // Fetch opportunities for the user's club
      console.log('🔍 Fetching opportunities for club:', clubId);
      const opportunitiesResponse = await apiClient.getVolunteerOpportunities({ club: clubId });

      console.log('📋 Opportunities API response:', {
        success: opportunitiesResponse.success,
        hasData: !!opportunitiesResponse.data,
        hasOpportunities: !!opportunitiesResponse.data?.opportunities,
        error: opportunitiesResponse.error,
        rawResponse: opportunitiesResponse
      });
      
      if (!opportunitiesResponse.success) {
        console.log('❌ Failed to fetch opportunities:', opportunitiesResponse.error);
        toast({
          title: 'Error',
          description: opportunitiesResponse.error || 'Failed to fetch volunteer opportunities',
          variant: 'destructive',
        });
        return;
      }
      
      const allOpportunities = opportunitiesResponse.data?.opportunities || [];
      console.log('✅ Processed opportunities:', {
        count: allOpportunities.length,
        opportunities: allOpportunities.map(o => ({
          id: o._id,
          title: o.title,
          club: o.club,
          status: o.status,
          timeSlots: o.timeSlots?.length || 0
        }))
      });

      setOpportunities(allOpportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch volunteer opportunities',
        variant: 'destructive',
      });
    }
  }, [toast]);

  React.useEffect(() => {
    console.log('🔄 Effect triggered - fetching opportunities');
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Log state changes
  React.useEffect(() => {
    console.log('📊 Opportunities state updated:', {
      count: opportunities.length,
      opportunities: opportunities.map((o: VolunteerOpportunity) => ({
        id: o._id,
        title: o.title,
        status: o.status
      }))
    });
  }, [opportunities]);

  const handleSignUp = async (opportunityId: string, timeSlotId: string) => {
    console.log('🎯 Attempting to sign up for opportunity:', { opportunityId, timeSlotId });
    try {
      const response = await apiClient.signUpForVolunteerOpportunity(opportunityId, timeSlotId);
      console.log('📝 Sign up response:', {
        success: response.success,
        data: response.data,
        error: response.error
      });
      
      if (response.success) {
        console.log('✅ Successfully signed up for opportunity');
        toast({
          title: 'Success',
          description: 'Successfully signed up for the volunteer opportunity',
        });
        fetchOpportunities();
      } else {
        console.log('❌ Failed to sign up:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to sign up for the volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error in sign up:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign up for the volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async (opportunityId: string, timeSlotId: string) => {
    console.log('🚫 Attempting to withdraw from opportunity:', { opportunityId, timeSlotId });
    try {
      const response = await apiClient.withdrawFromVolunteerOpportunity(opportunityId, timeSlotId);
      console.log('📝 Withdraw response:', {
        success: response.success,
        data: response.data,
        error: response.error
      });
      
      if (response.success) {
        console.log('✅ Successfully withdrawn from opportunity');
        toast({
          title: 'Success',
          description: 'Successfully withdrawn from the volunteer opportunity',
        });
        fetchOpportunities();
      } else {
        console.log('❌ Failed to withdraw:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to withdraw from the volunteer opportunity',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error in withdraw:', error);
      toast({
        title: 'Error',
        description: 'Failed to withdraw from the volunteer opportunity',
        variant: 'destructive',
      });
    }
  };

  const handlePreferencesSubmit = async (preferences: VolunteerProfile) => {
    console.log('🔄 Updating volunteer preferences:', preferences);
    try {
      const response = await apiClient.updateVolunteerProfile(preferences);
      console.log('📝 Update preferences response:', {
        success: response.success,
        data: response.data,
        error: response.error
      });
      
      if (response.success) {
        console.log('✅ Successfully updated preferences');
        setUserPreferences(preferences);
        setIsModalOpen(false);
        toast({
          title: 'Success',
          description: 'Successfully updated volunteer preferences',
        });
      } else {
        console.log('❌ Failed to update preferences:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to update volunteer preferences',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update volunteer preferences',
        variant: 'destructive',
      });
    }
  };

  const availableOpportunities = opportunities.filter(
    (opportunity: VolunteerOpportunity) => opportunity.status === 'open'
  );

  const myOpportunities = opportunities.filter((opportunity: VolunteerOpportunity) =>
    opportunity.timeSlots.some((slot: { volunteersAssigned: string[] }) =>
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
              availableOpportunities.map((opportunity: VolunteerOpportunity) => (
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
              myOpportunities.map((opportunity: VolunteerOpportunity) => (
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
