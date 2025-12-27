import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VolunteerProfile } from '@/lib/api';

interface VolunteerSignUpModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (preferences: VolunteerProfile) => void;
  initialPreferences?: VolunteerProfile;
}

const defaultPreferences: VolunteerProfile = {
  isVolunteer: true,
  interests: [],
  availability: {
    weekdays: false,
    weekends: false,
    evenings: false,
  },
  skills: [],
  notes: '',
};

export function VolunteerSignUpModal({
  open,
  onClose,
  onSubmit,
  initialPreferences = defaultPreferences,
}: VolunteerSignUpModalProps) {
  const [preferences, setPreferences] = React.useState<VolunteerProfile>(initialPreferences);
  const [newInterest, setNewInterest] = React.useState('');
  const [newSkill, setNewSkill] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(preferences as VolunteerProfile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !preferences.interests.includes(newInterest.trim())) {
      setPreferences({
        ...preferences,
        interests: [...preferences.interests, newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setPreferences({
      ...preferences,
      interests: preferences.interests.filter((i) => i !== interest),
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !preferences.skills.includes(newSkill.trim())) {
      setPreferences({
        ...preferences,
        skills: [...preferences.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setPreferences({
      ...preferences,
      skills: preferences.skills.filter((s) => s !== skill),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Volunteer Preferences</DialogTitle>
          <DialogDescription>
            Set your volunteering preferences and availability.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Availability</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekdays"
                    checked={preferences.availability.weekdays}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        availability: { ...preferences.availability, weekdays: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="weekdays">Weekdays</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weekends"
                    checked={preferences.availability.weekends}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        availability: { ...preferences.availability, weekends: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="weekends">Weekends</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="evenings"
                    checked={preferences.availability.evenings}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        availability: { ...preferences.availability, evenings: !!checked },
                      })
                    }
                  />
                  <Label htmlFor="evenings">Evenings</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Interests</h4>
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest"
                />
                <Button type="button" onClick={addInterest}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.interests.map((interest) => (
                  <div
                    key={interest}
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Skills</h4>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                />
                <Button type="button" onClick={addSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={preferences.notes}
                onChange={(e) =>
                  setPreferences({ ...preferences, notes: e.target.value })
                }
                placeholder="Any additional information you'd like to share..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Preferences
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
