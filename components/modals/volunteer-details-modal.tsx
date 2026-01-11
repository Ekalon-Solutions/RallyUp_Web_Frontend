import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Volunteer } from '@/lib/api';
import { 
  Clock, 
  MapPin, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  Users,
  Target
} from 'lucide-react';

interface VolunteerDetailsModalProps {
  volunteer: Volunteer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VolunteerDetailsModal({ volunteer, isOpen, onClose }: VolunteerDetailsModalProps) {
  if (!volunteer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      case 'on-assignment': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-yellow-100 text-yellow-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Volunteer Profile - {volunteer.user.name}
          </DialogTitle>
          <DialogDescription>
            Detailed information about this volunteer's skills, availability, and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{volunteer.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{volunteer.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{volunteer.user.countryCode} {volunteer.user.phoneNumber}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Status & Club</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(volunteer.status)}>
                    {volunteer.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{volunteer.club.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span>{volunteer.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Skills & Interests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Skills & Interests</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {volunteer.skills.length > 0 ? (
                    volunteer.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No skills specified</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {volunteer.interests.length > 0 ? (
                    volunteer.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No interests specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Experience</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Level</h4>
                <Badge className={getExperienceColor(volunteer.experience.level)}>
                  {volunteer.experience.level}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Years of Experience</h4>
                <span>{volunteer.experience.yearsOfExperience} years</span>
              </div>
            </div>
            {volunteer.experience.previousRoles.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Previous Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {volunteer.experience.previousRoles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Availability */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Availability</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Time Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${volunteer.availability.weekdays ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Weekdays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${volunteer.availability.weekends ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Weekends</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${volunteer.availability.evenings ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Evenings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${volunteer.availability.flexible ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Flexible</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Max {volunteer.preferences.maxHoursPerWeek} hours/week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{volunteer.preferences.locationPreference}</span>
                  </div>
                </div>
              </div>
            </div>
            {volunteer.preferences.preferredEventTypes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Preferred Event Types</h4>
                <div className="flex flex-wrap gap-2">
                  {volunteer.preferences.preferredEventTypes.map((type) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          {volunteer.emergencyContact && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Contact Person</h4>
                    <p>{volunteer.emergencyContact.name}</p>
                    <p className="text-sm text-muted-foreground">{volunteer.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Contact Details</h4>
                    <p>{volunteer.emergencyContact.phone}</p>
                    <p className="text-sm text-muted-foreground">{volunteer.emergencyContact.email}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Certifications */}
          {volunteer.certifications && volunteer.certifications.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Certifications</h3>
                <div className="space-y-3">
                  {volunteer.certifications.map((cert, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{cert.name}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                          <p className="text-sm text-muted-foreground">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                          </p>
                          {cert.expiryDate && (
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Award className="w-5 h-5 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {volunteer.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Notes</h3>
                <p className="text-muted-foreground">{volunteer.notes}</p>
              </div>
            </>
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
