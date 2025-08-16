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
  const [volunteerProfile, setVolunteerProfile] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('available');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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
        hasClub: !!userProfileResponse.data?.club,
        userData: userProfileResponse.data,
        clubId: userProfileResponse.data?.club?._id,
        clubName: userProfileResponse.data?.club?.name
      });
      
      if (!userProfileResponse.success || !userProfileResponse.data?.club) {
        console.log('❌ No club found in user profile');
        setOpportunities([]);
        setError('You need to be a member of a club to see volunteer opportunities');
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
      
      // Handle both response structures: direct array or wrapped in data.opportunities
      let allOpportunities: VolunteerOpportunity[] = [];
      if (Array.isArray(opportunitiesResponse.data)) {
        // API returns array directly (fallback for backward compatibility)
        allOpportunities = opportunitiesResponse.data as VolunteerOpportunity[];
        console.log('📊 Using direct array response');
      } else if (opportunitiesResponse.data?.opportunities && Array.isArray(opportunitiesResponse.data.opportunities)) {
        // API returns wrapped in data.opportunities (expected structure)
        allOpportunities = opportunitiesResponse.data.opportunities as VolunteerOpportunity[];
        console.log('📊 Using wrapped opportunities response');
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
    console.log('🏢 User club:', 'club' in (user || {}) ? (user as any).club : 'No club');
    
    // Frontend validation to prevent duplicate signup attempts
    if (!volunteerProfile) {
      toast({
        title: 'Error',
        description: 'You need to create a volunteer profile first',
        variant: 'destructive',
      });
      return;
    }
    
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
    }
  };

  const handleWithdraw = async (opportunityId: string, timeSlotId: string) => {
    console.log('🚫 Attempting to withdraw from opportunity:', { opportunityId, timeSlotId });
    
    // Frontend validation
    if (!volunteerProfile) {
      toast({
        title: 'Error',
        description: 'Volunteer profile not found',
        variant: 'destructive',
      });
      return;
    }
    
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
      const profileResponse = await apiClient.getVolunteerProfile();
      
      if (!profileResponse.success) {
        // Profile doesn't exist, create one first
        console.log('📝 Creating new volunteer profile...');
        const createResponse = await apiClient.createVolunteerProfile({
          club: user?.club?._id || '',
          skills: preferences.skills || [],
          interests: preferences.interests || [],
          availability: {
            weekdays: preferences.availability?.weekdays || false,
            weekends: preferences.availability?.weekends || false,
            evenings: preferences.availability?.evenings || false,
            flexible: false
          },
          experience: {
            level: 'beginner',
            yearsOfExperience: 0,
            previousRoles: []
          },
          preferences: {
            preferredEventTypes: [],
            maxHoursPerWeek: 10,
            preferredTimeSlots: [],
            locationPreference: 'on-site'
          },
          emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
            email: ''
          },
          notes: preferences.notes || ''
        });
        
        if (createResponse.success) {
          console.log('✅ Successfully created volunteer profile');
          setUserPreferences(preferences);
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
            evenings: preferences.availability?.evenings || false,
            flexible: false
          },
          notes: preferences.notes || ''
        });
        
        if (updateResponse.success) {
          console.log('✅ Successfully updated volunteer profile');
          setUserPreferences(preferences);
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
        club: o.club,
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
            <Button onClick={() => setIsModalOpen(true)}>
              {userPreferences?.isVolunteer ? 'Update Preferences' : 'Become a Volunteer'}
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
                {user && 'volunteering' in user && !user.volunteering?.isVolunteer && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 You need to set up your volunteer preferences first. Click "Become a Volunteer" to get started!
                    </p>
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
          initialPreferences={userPreferences || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
