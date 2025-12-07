export interface UserProfileData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: Date | string;
  gender?: string;
  phone_number?: string;
  phone_country_code?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  zip_code?: string;
  country?: string;
  id_proof_type?: string;
  id_proof_number?: string;
}


export function calculateUserProfileCompletion(user: UserProfileData | null | undefined): number {
  if (!user) return 0;

  const requiredFields: Array<keyof UserProfileData> = [
    'username',
    'email',
    'first_name',
    'last_name',
    'date_of_birth',
    'gender',
    'phone_number',
    'phone_country_code',
    'address_line1',
    'city',
    'state_province',
    'zip_code',
    'country',
    'id_proof_type',
    'id_proof_number',
  ];

  let filledFields = 0;
  const totalFields = requiredFields.length;

  requiredFields.forEach((field) => {
    const value = user[field];
    
    if (value !== undefined && value !== null && value !== '') {
      if (field === 'date_of_birth') {
        const date = value instanceof Date ? value : new Date(value);
        if (!isNaN(date.getTime())) {
          filledFields++;
        }
      } else {
        if (typeof value === 'string' && value.trim().length > 0) {
          filledFields++;
        } else if (typeof value !== 'string') {
          filledFields++;
        }
      }
    }
  });

  const percentage = Math.round((filledFields / totalFields) * 100);
  return Math.min(percentage, 100);
}

export function isUserProfileComplete(user: UserProfileData | null | undefined): boolean {
  return calculateUserProfileCompletion(user) === 100;
}
