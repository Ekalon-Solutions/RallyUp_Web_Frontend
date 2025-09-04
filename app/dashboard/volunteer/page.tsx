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

  const [volunteerProfile, setVolunteerProfile] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('available');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signingUp, setSigningUp] = React.useState<string | null>(null); // Track which opportunity is being signed up for
  const { toast } = useToast();

  const fetchVolunteerProfile = React.useCallback(async () => {
    try {
      const profileResponse = await apiClient.getVolunteerProfile();
      if (profileResponse.success) {
        setVolunteerProfile(profileResponse.data);
        console.log('✅ Volunteer profile fetched:', profileResponse.data);
      } else {
        console.log('⚠️ No volunteer profile found');
        setVolunteerProfile(null);
      }
    } catch (error) {
      console.error('❌ Error fetching volunteer profile:', error);
      setVolunteerProfile(null);
    }
  }, []);

  const fetchOpportunities = React.useCallback(async () => {
    console.log('🔍 Starting to fetch opportunities...');
    setLoading(true);
    setError(null);
    
    try {
      // Get user's profile to get club info
      console.log('📱 Fetching user profile...');
      const userProfileResponse = await apiClient.userProfile();
      console.log('👤 User profile response:', {
        success: userProfileResponse.success,
        hasData: !!userProfileResponse.data,
        hasMemberships: !!userProfileResponse.data?.memberships,
        userData: userProfileResponse.data,
        memberships: userProfileResponse.data?.memberships
      });
      
      // Check if user has active club memberships
      if (!userProfileResponse.success || !userProfileResponse.data?.memberships || userProfileResponse.data.memberships.length === 0) {
        console.log('❌ No club memberships found in user profile');
        setOpportunities([]);
        setError('You need to be a member of a club to see volunteer opportunities');
        toast({
          title: 'No Club Access',
          description: 'You need to be a member of a club to see volunteer opportunities',
          variant: 'default',
        });
        return;
      }

      // Get the first active membership (assuming user can only be in one club at a time)
      const activeMembership = userProfileResponse.data.memberships.find(membership =>
        membership.status === 'active'
      );

      if (!activeMembership?.club_id?._id) {
        console.log('❌ No active club membership found');
        setOpportunities([]);
        setError('You need to have an active club membership to see volunteer opportunities');
        toast({
          title: 'No Active Membership',
          description: 'You need to have an active club membership to see volunteer opportunities',
          variant: 'default',
        });
        return;
      }

      const clubId = activeMembership.club_id._id;
      console.log('🏢 Found club ID:', clubId);
      console.log('🏢 Club details:', activeMembership.club_id);
      
      // Fetch opportunities for the user's club
      console.log('🔍 Fetching opportunities for club:', clubId);
      const opportunitiesResponse = await apiClient.getVolunteerOpportunities({ club: clubId });

      console.log('📋 Opportunities API response:', {
        success: opportunitiesResponse.success,
        hasData: !!opportunitiesResponse.data,
        error: opportunitiesResponse.error,
        rawResponse: opportunitiesResponse,
        dataType: typeof opportunitiesResponse.data,
        isArray: Array.isArray(opportunitiesResponse.data)
      });
      
      if (!opportunitiesResponse.success) {
        console.log('❌ Failed to fetch opportunities:', opportunitiesResponse.error);
        setError(opportunitiesResponse.error || 'Failed to fetch volunteer opportunities');
        toast({
          title: 'Error',
          description: opportunitiesResponse.error || 'Failed to fetch volunteer opportunities',
          variant: 'destructive',
        });
        return;
      }
      
      // The API returns { opportunities: VolunteerOpportunity[], pagination: {...} }
      let allOpportunities: VolunteerOpportunity[] = [];
      if ((opportunitiesResponse.data as any)?.opportunities && Array.isArray((opportunitiesResponse.data as any).opportunities)) {
        allOpportunities = (opportunitiesResponse.data as any).opportunities as VolunteerOpportunity[];
        console.log('📊 Using opportunities array from response');
      } else if (Array.isArray(opportunitiesResponse.data)) {
        // Fallback for direct array response
        allOpportunities = opportunitiesResponse.data as VolunteerOpportunity[];
        console.log('📊 Using direct array response (fallback)');
      } else {
        // Fallback to empty array
        allOpportunities = [];
        console.log('📊 Using fallback empty array');
      }
      
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
      setError(null);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch volunteer opportunities';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    console.log('🔄 Effect triggered - fetching opportunities and volunteer profile');
    fetchOpportunities();
    fetchVolunteerProfile();
  }, [fetchOpportunities, fetchVolunteerProfile]);

  // Debug volunteer profile changes
  React.useEffect(() => {
    console.log('🔍 Volunteer profile updated:', {
      hasProfile: !!volunteerProfile,
      profileId: volunteerProfile?._id,
      profileData: volunteerProfile
    });
  }, [volunteerProfile]);

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
    console.log('👤 Current user:', user);
    console.log('🔑 User ID:', user?._id);
    console.log('👥 Volunteer profile:', volunteerProfile);
    
    // Get club info from user's active membership
    const activeMembership = (user as any)?.memberships?.find((membership: any) => membership.status === 'active');
    const userClub = activeMembership?.club_id?.name || 'No active club membership';
    console.log('🏢 User club:', userClub);
    
    // Frontend validation to prevent duplicate signup attempts
    if (!volunteerProfile) {
      console.log('❌ No volunteer profile found');
      toast({
        title: 'Error',
        description: 'You need to create a volunteer profile first',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('✅ Volunteer profile found:', volunteerProfile._id);
    
    // Check if already signed up for this time slot
    const opportunity = opportunities.find(o => o._id === opportunityId);
    if (opportunity) {
      const timeSlot = opportunity.timeSlots.find(slot => slot._id === timeSlotId);
      if (timeSlot && timeSlot.volunteersAssigned.includes(volunteerProfile._id)) {
        toast({
          title: 'Already Signed Up',
          description: 'You are already signed up for this time slot',
          variant: 'default',
        });
        return;
      }
    }
    
    try {
      setSigningUp(`${opportunityId}-${timeSlotId}`);
      const response = await apiClient.signUpForVolunteerOpportunity(opportunityId, timeSlotId);
      console.log('📝 Sign up response:', {
        success: response.success,
        data: response.data,
        error: response.error,
        fullResponse: response
      });
      
      if (response.success) {
        console.log('✅ Successfully signed up for opportunity');
        toast({
          title: 'Success',
          description: 'Successfully signed up for the volunteer opportunity',
        });
        fetchOpportunities();
        fetchVolunteerProfile(); // Refresh volunteer profile to update myOpportunities
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
    } finally {
      setSigningUp(null);
    }
  };

  const handleWithdraw = async (opportunityId: string, timeSlotId: string) => {
    console.log('🚫 Attempting to withdraw from opportunity:', { opportunityId, timeSlotId });
    console.log('👥 Volunteer profile:', volunteerProfile);
    
    // Frontend validation
    if (!volunteerProfile) {
      console.log('❌ No volunteer profile found for withdrawal');
      toast({
        title: 'Error',
        description: 'Volunteer profile not found',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('✅ Volunteer profile found for withdrawal:', volunteerProfile._id);
    
    // Check if actually signed up for this time slot
    const opportunity = opportunities.find(o => o._id === opportunityId);
    if (opportunity) {
      const timeSlot = opportunity.timeSlots.find(slot => slot._id === timeSlotId);
      if (!timeSlot || !timeSlot.volunteersAssigned.includes(volunteerProfile._id)) {
        toast({
          title: 'Not Signed Up',
          description: 'You are not signed up for this time slot',
          variant: 'destructive',
        });
        return;
      }
    }
    
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
        fetchVolunteerProfile(); // Refresh volunteer profile to update myOpportunities
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
      // First check if volunteer profile exists
      console.log('🔍 Checking if volunteer profile exists...');
      const profileResponse = await apiClient.getVolunteerProfile();
      console.log('📋 Profile check response:', {
        success: profileResponse.success,
        data: profileResponse.data,
        error: profileResponse.error
      });
      
      if (!profileResponse.success) {
        // Profile doesn't exist, create one first
        console.log('📝 Creating new volunteer profile...');
        // Get club ID from user's active membership
        const activeMembership = (user as any)?.memberships?.find((membership: any) => membership.status === 'active');
        const clubId = activeMembership?.club_id?._id || '';
        console.log('🏢 Club ID for volunteer profile:', clubId);
        
        if (!clubId) {
          throw new Error('You need to be a member of a club to create a volunteer profile');
        }

        const profileData = {
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false
          },
          notes: preferences.notes || ''
        };
        console.log('📤 Sending volunteer profile data:', profileData);

        const createResponse = await apiClient.createVolunteerProfile(profileData);
        console.log('📥 Create volunteer profile response:', {
          success: createResponse.success,
          data: createResponse.data,
          error: createResponse.error
        });
        
        if (createResponse.success) {
          console.log('✅ Successfully created volunteer profile');
          // Refresh volunteer profile from API
          fetchVolunteerProfile();
          setIsModalOpen(false);
          toast({
            title: 'Success',
            description: 'Successfully created volunteer profile',
          });
        } else {
          throw new Error(createResponse.error || 'Failed to create volunteer profile');
        }
      } else {
        // Profile exists, update it
        console.log('📝 Updating existing volunteer profile...');
        const updateResponse = await apiClient.updateVolunteerProfile({
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false
          },
          notes: preferences.notes || ''
        });
        
        if (updateResponse.success) {
          console.log('✅ Successfully updated volunteer profile');
          // Refresh volunteer profile from API
          fetchVolunteerProfile();
          setIsModalOpen(false);
          toast({
            title: 'Success',
            description: 'Successfully updated volunteer preferences',
          });
        } else {
          throw new Error(updateResponse.error || 'Failed to update volunteer profile');
        }
      }
    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update volunteer preferences',
        variant: 'destructive',
      });
    }
  };

  const availableOpportunities = opportunities.filter(
    (opportunity: VolunteerOpportunity) => opportunity.status === 'open'
  );

  const myOpportunities = opportunities.filter((opportunity: VolunteerOpportunity) => {
    const hasAssignment = opportunity.timeSlots.some((slot: any) => {
      // Check if the current volunteer is assigned to this time slot
      const isAssigned = volunteerProfile && slot.volunteersAssigned.includes(volunteerProfile._id);
      if (volunteerProfile) {
        console.log(`🔍 Checking slot ${slot._id}:`, {
          volunteerProfileId: volunteerProfile._id,
          volunteersAssigned: slot.volunteersAssigned,
          isAssigned
        });
      }
      return isAssigned;
    });
    
    if (volunteerProfile && hasAssignment) {
      console.log(`✅ Opportunity "${opportunity.title}" is in myOpportunities`);
    }
    
    return hasAssignment;
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Current opportunities state:', {
      total: opportunities.length,
      available: availableOpportunities.length,
      myOpportunities: myOpportunities.length,
      volunteerProfile: volunteerProfile ? { id: volunteerProfile._id, name: volunteerProfile.user?.name } : null,
      opportunities: opportunities.map(o => ({
        id: o._id,
        title: o.title,
        status: o.status,
        club: o.club || 'Unknown Club',
        timeSlots: o.timeSlots?.map(slot => ({
          id: slot._id,
          volunteersAssigned: slot.volunteersAssigned?.length || 0
        }))
      }))
    });
  }, [opportunities, availableOpportunities, myOpportunities, volunteerProfile]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOpportunities}>
              Refresh Opportunities
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className={!volunteerProfile ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              {volunteerProfile ? 'Update Preferences' : '🎯 Become a Volunteer'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Opportunities</TabsTrigger>
            <TabsTrigger value="my-opportunities">My Opportunities</TabsTrigger>
          </TabsList>

          {/* Status Message */}
          <div className="text-center py-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading volunteer opportunities...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {opportunities.length === 0 
                    ? "No volunteer opportunities found" 
                    : `Found ${opportunities.length} total opportunities, ${availableOpportunities.length} available`
                  }
                </p>
                {user && !volunteerProfile && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎯</div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Ready to Volunteer?</h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          You need to set up your volunteer profile first to sign up for opportunities. Click "Become a Volunteer" to get started!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="available" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  Loading volunteer opportunities...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  {error}
                </p>
              </div>
            ) : availableOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  {opportunities.length === 0 
                    ? "No volunteer opportunities available at the moment."
                    : "No open volunteer opportunities at the moment."
                  }
                </p>
                {opportunities.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      There are {opportunities.length} total opportunities:
                    </p>
                    <div className="space-y-4">
                      {opportunities.map(opportunity => (
                        <div key={opportunity._id} className="border rounded-lg p-4 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{opportunity.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              opportunity.status === 'open' ? 'bg-green-100 text-green-800' :
                              opportunity.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              opportunity.status === 'filled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {opportunity.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{opportunity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {opportunity.status} • 
                            {opportunity.timeSlots?.length || 0} time slot{opportunity.timeSlots?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              availableOpportunities.map((opportunity: VolunteerOpportunity) => (
                <VolunteerOpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  onSignUp={handleSignUp}
                  currentVolunteerId={volunteerProfile?._id}
                  signingUp={signingUp}
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
                  currentVolunteerId={volunteerProfile?._id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <VolunteerSignUpModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handlePreferencesSubmit}
          initialPreferences={volunteerProfile || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
