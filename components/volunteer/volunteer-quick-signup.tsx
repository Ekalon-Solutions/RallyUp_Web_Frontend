import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Heart, Clock, Star } from 'lucide-react';
import { VolunteerProfile } from '@/lib/api';

interface VolunteerQuickSignupProps {
  onSignup: () => void;
  currentProfile?: VolunteerProfile;
  isSignedUp?: boolean;
}

export function VolunteerQuickSignup({ onSignup, currentProfile, isSignedUp = false }: VolunteerQuickSignupProps) {
  if (isSignedUp) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Heart className="w-5 h-5" />
            You're a Volunteer!
          </CardTitle>
          <CardDescription className="text-green-700">
            Thank you for your commitment to helping others.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentProfile?.skills && currentProfile.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-2">Your Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Clock className="w-4 h-4" />
              <span>
                Available: {[
                  currentProfile?.availability?.weekdays && 'Weekdays',
                  currentProfile?.availability?.weekends && 'Weekends',
                  currentProfile?.availability?.evenings && 'Evenings'
                ].filter(Boolean).join(', ') || 'Not specified'}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSignup}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Update Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Users className="w-5 h-5" />
          Become a Volunteer
        </CardTitle>
        <CardDescription className="text-blue-700">
          Make a difference in your community by volunteering your time and skills.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700">Help Others</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700">Build Skills</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700">Connect</p>
            </div>
          </div>
          
          <div className="text-sm text-blue-700">
            <p className="mb-2">As a volunteer, you can:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Help organize events and activities</li>
              <li>Support community initiatives</li>
              <li>Share your skills and knowledge</li>
              <li>Meet like-minded people</li>
            </ul>
          </div>
          
          <Button 
            onClick={onSignup}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Heart className="w-4 h-4 mr-2" />
            Start Volunteering
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
