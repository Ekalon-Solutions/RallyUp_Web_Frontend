export interface UserProfileData {
  name?: string;
  email?: string;
  phone_number?: string;
  countryCode?: string;
  isPhoneVerified?: boolean;
  club?: any;
  volunteering?: {
    isVolunteer?: boolean;
    skills?: string[];
    interests?: string[];
    availability?: {
      weekdays?: boolean;
      weekends?: boolean;
      evenings?: boolean;
    };
    notes?: string;
  };
  memberships?: any[];
}


export function calculateUserProfileCompletion(user: UserProfileData | null | undefined): number {
  if (!user) return 0;

  let filledFields = 0;
  let totalFields = 0;

  const basicFields: Array<{ key: keyof UserProfileData; weight: number }> = [
    { key: 'name', weight: 1 },
    { key: 'email', weight: 1 },
    { key: 'phone_number', weight: 1 },
    { key: 'countryCode', weight: 1 },
  ];

  basicFields.forEach(({ key, weight }) => {
    totalFields += weight;
    const value = user[key];
    
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string' && value.trim().length > 0) {
        filledFields += weight;
      } else if (typeof value !== 'string') {
        filledFields += weight;
      }
    }
  });

  totalFields += 1;
  if (user.isPhoneVerified) {
    filledFields += 1;
  }

  totalFields += 1;
  if (user.club || (user.memberships && user.memberships.length > 0)) {
    filledFields += 1;
  }
  
  totalFields += 1;
  if (user.volunteering?.isVolunteer) {
    filledFields += 1;
  }

  const percentage = Math.round((filledFields / totalFields) * 100);
  return Math.min(percentage, 100);
}

export function isUserProfileComplete(user: UserProfileData | null | undefined): boolean {
  return calculateUserProfileCompletion(user) === 100;
}
