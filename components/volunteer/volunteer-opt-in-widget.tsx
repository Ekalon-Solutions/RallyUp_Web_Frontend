'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, UserCheck, UserX, Settings, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VolunteerSignUpModal } from './volunteer-signup-modal';
import { apiClient, VolunteerProfile } from '@/lib/api';

interface VolunteerOptInWidgetProps {
  currentUser: any;
  clubId?: string;
  onProfileUpdate?: (profile: VolunteerProfile | null) => void;
}

export function VolunteerOptInWidget({ currentUser, clubId, onProfileUpdate }: VolunteerOptInWidgetProps) {
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVolunteerProfile();
  }, [currentUser]);

  const fetchVolunteerProfile = async () => {
    try {
      setInitialLoading(true);
      const response = await apiClient.getVolunteerProfile();

      if (response.success && response.data) {
        const volunteer = (response.data as any)?.volunteer ?? response.data;
        if (volunteer) {
          setVolunteerProfile(volunteer);
          setIsVolunteer(volunteer.isActive !== false);
        }
      }
    } catch (error) {
      // console.error('Error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleOptToggle = async (checked: boolean) => {
    if (checked && !volunteerProfile) {
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.updateVolunteerProfile({ isActive: checked } as any);

      if (response.success && response.data) {
        const volunteer = (response.data as any)?.volunteer ?? response.data;
        setVolunteerProfile(volunteer);
        setIsVolunteer(checked);
        onProfileUpdate?.(volunteer);

        toast({
          title: checked ? "Opted In!" : "Opted Out",
          description: checked
            ? "You're now available for volunteering opportunities!"
            : "You've been removed from the volunteer list.",
          variant: checked ? "default" : "destructive",
        });
      } else {
        throw new Error('Failed to update volunteer status');
      }
    } catch (error) {
      // console.error('Error updating volunteer status:', error);
      toast({
        title: "Error",
        description: "Failed to update volunteer status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (profile: VolunteerProfile) => {
    try {
      setLoading(true);
      const payload = { ...profile, clubId, isActive: true } as any;
      const response = volunteerProfile
        ? await apiClient.updateVolunteerProfile(payload)
        : await apiClient.createVolunteerProfile(payload);

      if (response.success && response.data) {
        const volunteer = (response.data as any)?.volunteer ?? response.data;
        setVolunteerProfile(volunteer);
        setIsVolunteer(true);
        setShowModal(false);
        onProfileUpdate?.(volunteer);

        toast({
          title: "Welcome, Volunteer!",
          description: "Your volunteer profile has been created successfully!",
        });
      } else {
        throw new Error('Failed to create volunteer profile');
      }
    } catch (error) {
      // console.error('Error creating volunteer profile:', error);
      toast({
        title: "Error",
        description: "Failed to create volunteer profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={isVolunteer ? "border-green-200 bg-green-50/50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className={`w-5 h-5 ${isVolunteer ? 'text-green-600' : 'text-gray-400'}`} />
              <CardTitle className="text-lg">Volunteer Status</CardTitle>
            </div>
            {isVolunteer && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <CardDescription>
            {isVolunteer 
              ? "You're currently available for volunteering opportunities"
              : "Opt-in to help your community and make a difference"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              {isVolunteer ? (
                <UserCheck className="w-5 h-5 text-green-600" />
              ) : (
                <UserX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <Label htmlFor="volunteer-toggle" className="text-sm font-medium cursor-pointer">
                  {isVolunteer ? "Available for Volunteering" : "Not Available"}
                </Label>
                <p className="text-xs text-gray-500">
                  {isVolunteer ? "Admins can see you in volunteer list" : "You won't appear in volunteer searches"}
                </p>
              </div>
            </div>
            <Switch
              id="volunteer-toggle"
              checked={isVolunteer}
              onCheckedChange={handleOptToggle}
              disabled={loading}
            />
          </div>

          {isVolunteer && volunteerProfile && (
            <div className="space-y-3 pt-2">
              {volunteerProfile.skills && volunteerProfile.skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Your Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteerProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {volunteerProfile.availability && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Availability</p>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteerProfile.availability.weekdays && (
                      <Badge variant="outline" className="text-xs">Weekdays</Badge>
                    )}
                    {volunteerProfile.availability.weekends && (
                      <Badge variant="outline" className="text-xs">Weekends</Badge>
                    )}
                    {volunteerProfile.availability.evenings && (
                      <Badge variant="outline" className="text-xs">Evenings</Badge>
                    )}
                    {volunteerProfile.availability.flexible && (
                      <Badge variant="outline" className="text-xs">Flexible</Badge>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowModal(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}

          {!isVolunteer && !volunteerProfile && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-3">
                Make a difference! Toggle above to become a volunteer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <VolunteerSignUpModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleProfileSubmit}
        initialPreferences={volunteerProfile || undefined}
      />
    </>
  );
}
