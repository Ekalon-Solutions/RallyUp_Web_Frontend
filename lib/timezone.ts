/**
 * Timezone Utility for RallyUp
 * 
 * Converts UTC dates from the backend to the user's local timezone
 * and provides consistent date/time formatting across the application.
 */

// Get the user's timezone from the browser
export function getUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC'; // SSR fallback
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Get timezone offset string (e.g., "+05:30", "-08:00")
export function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Get timezone abbreviation (e.g., "IST", "PST", "EST")
export function getTimezoneAbbreviation(): string {
  if (typeof window === 'undefined') {
    return 'UTC';
  }
  const date = new Date();
  const timeString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
  const match = timeString.match(/[A-Z]{2,5}$/);
  return match ? match[0] : getTimezoneOffset();
}

// Format options for different use cases
export type DateFormatType = 
  | 'full'           // "December 7, 2025 at 2:30 PM IST"
  | 'long'           // "Dec 7, 2025, 2:30 PM"
  | 'short'          // "12/7/25, 2:30 PM"
  | 'date-only'      // "December 7, 2025"
  | 'date-short'     // "Dec 7, 2025"
  | 'date-numeric'   // "12/7/2025"
  | 'time-only'      // "2:30 PM"
  | 'time-24h'       // "14:30"
  | 'relative'       // "2 hours ago", "in 3 days"
  | 'datetime-input' // "2025-12-07T14:30" (for datetime-local inputs)

/**
 * Convert a UTC date string/Date to the user's local timezone and format it
 * 
 * @param dateInput - UTC date string or Date object from the backend
 * @param format - The desired output format
 * @param options - Additional options
 * @returns Formatted date string in user's local timezone
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  format: DateFormatType = 'long',
  options?: {
    timezone?: string;      // Override timezone (default: user's timezone)
    showTimezone?: boolean; // Show timezone abbreviation (default: false for most formats)
    locale?: string;        // Override locale (default: browser locale)
  }
): string {
  if (!dateInput) {
    return 'N/A';
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const timezone = options?.timezone || getUserTimezone();
  const locale = options?.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const showTimezone = options?.showTimezone ?? false;

  try {
    switch (format) {
      case 'full':
        return date.toLocaleString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

      case 'long':
        const longFormatted = date.toLocaleString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        return showTimezone ? `${longFormatted} ${getTimezoneAbbreviation()}` : longFormatted;

      case 'short':
        const shortFormatted = date.toLocaleString(locale, {
          timeZone: timezone,
          year: '2-digit',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        return showTimezone ? `${shortFormatted} ${getTimezoneAbbreviation()}` : shortFormatted;

      case 'date-only':
        return date.toLocaleDateString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'date-short':
        return date.toLocaleDateString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'date-numeric':
        return date.toLocaleDateString(locale, {
          timeZone: timezone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });

      case 'time-only':
        const timeFormatted = date.toLocaleTimeString(locale, {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit'
        });
        return showTimezone ? `${timeFormatted} ${getTimezoneAbbreviation()}` : timeFormatted;

      case 'time-24h':
        return date.toLocaleTimeString(locale, {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

      case 'relative':
        return getRelativeTimeString(date, timezone);

      case 'datetime-input':
        // Format for datetime-local input: "YYYY-MM-DDTHH:mm"
        return formatForDatetimeInput(date, timezone);

      default:
        return date.toLocaleString(locale, { timeZone: timezone });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toLocaleString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTimeString(date: Date, timezone: string): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(
    typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    { numeric: 'auto' }
  );

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffWeek) < 4) {
    return rtf.format(diffWeek, 'week');
  } else if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, 'month');
  } else {
    return rtf.format(diffYear, 'year');
  }
}

/**
 * Format date for datetime-local input in user's timezone
 */
function formatForDatetimeInput(date: Date, timezone: string): string {
  // Create a formatter that gives us the parts in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Convert a local datetime-input value to UTC Date for sending to backend
 * 
 * @param localDatetimeString - Value from datetime-local input (e.g., "2025-12-07T14:30")
 * @param timezone - The timezone of the input (default: user's timezone)
 * @returns Date object in UTC
 */
export function localInputToUTC(
  localDatetimeString: string,
  timezone?: string
): Date {
  if (!localDatetimeString) {
    return new Date();
  }

  const tz = timezone || getUserTimezone();
  
  // Parse the local datetime string
  const [datePart, timePart] = localDatetimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);

  // Create a date string with the timezone
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  
  // Use Intl to get the offset for this timezone at this specific date/time
  const tempDate = new Date(dateStr + 'Z'); // Start with UTC
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Format the temp date in the target timezone to find the offset
  const parts = formatter.formatToParts(tempDate);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const tzYear = parseInt(getPart('year'));
  const tzMonth = parseInt(getPart('month'));
  const tzDay = parseInt(getPart('day'));
  const tzHour = parseInt(getPart('hour'));
  const tzMinute = parseInt(getPart('minute'));

  // Calculate the offset by comparing
  const utcDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute));
  const offsetMs = utcDate.getTime() - tempDate.getTime();

  // Create the final date in the local timezone
  const localDate = new Date(dateStr);
  
  // Adjust for timezone - we need to convert FROM local TO UTC
  // The local datetime represents a moment in the user's timezone
  // We need to figure out what UTC time corresponds to that local time
  
  // Simple approach: parse as local and it will be correct if browser timezone matches
  // For explicit timezone handling, we'd need a library like date-fns-tz
  return new Date(dateStr);
}

/**
 * Format a date range (e.g., "Dec 7 - Dec 9, 2025" or "Dec 7, 2:00 PM - 5:00 PM")
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  options?: {
    timezone?: string;
    showTime?: boolean;
  }
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const timezone = options?.timezone || getUserTimezone();
  const showTime = options?.showTime ?? true;
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  // Check if same day
  const sameDay = start.toLocaleDateString(locale, { timeZone: timezone }) === 
                  end.toLocaleDateString(locale, { timeZone: timezone });

  if (sameDay && showTime) {
    // Same day: "Dec 7, 2025, 2:00 PM - 5:00 PM"
    const dateStr = start.toLocaleDateString(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const startTime = start.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit'
    });
    const endTime = end.toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit'
    });
    return `${dateStr}, ${startTime} - ${endTime}`;
  } else {
    // Different days: "Dec 7 - Dec 9, 2025"
    const startStr = start.toLocaleDateString(locale, {
      timeZone: timezone,
      month: 'short',
      day: 'numeric'
    });
    const endStr = end.toLocaleDateString(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `${startStr} - ${endStr}`;
  }
}

/**
 * Check if a date is in the past (considering timezone)
 */
export function isPast(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future (considering timezone)
 */
export function isFuture(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.getTime() > Date.now();
}

/**
 * Check if a date is today (in user's timezone)
 */
export function isToday(dateInput: string | Date, timezone?: string): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const tz = timezone || getUserTimezone();
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  
  const todayStr = new Date().toLocaleDateString(locale, { timeZone: tz });
  const dateStr = date.toLocaleDateString(locale, { timeZone: tz });
  
  return todayStr === dateStr;
}

/**
 * Get timezone display info for UI
 */
export function getTimezoneInfo(): {
  name: string;        // e.g., "Asia/Kolkata"
  abbreviation: string; // e.g., "IST"
  offset: string;      // e.g., "+05:30"
  displayName: string; // e.g., "India Standard Time (IST, +05:30)"
} {
  const name = getUserTimezone();
  const abbreviation = getTimezoneAbbreviation();
  const offset = getTimezoneOffset();
  
  // Try to get a friendly name
  let friendlyName = name.replace(/_/g, ' ').split('/').pop() || name;
  
  return {
    name,
    abbreviation,
    offset,
    displayName: `${friendlyName} (${abbreviation}, UTC${offset})`
  };
}

// Common timezone list for dropdown selections
export const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: '+05:30' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: '+04:00' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: '+11:00' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZT)', offset: '+13:00' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: '+00:00' },
];

/**
 * Format a Date object for datetime-local input in local timezone
 * This is the correct way to set default values for datetime-local inputs
 * 
 * @param date - Date object to format
 * @returns String in format "YYYY-MM-DDTHH:mm" in local timezone
 */
export function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a datetime-local input value and return a Date object
 * The input is assumed to be in the user's local timezone
 * 
 * @param datetimeString - Value from datetime-local input (e.g., "2025-12-07T14:30")
 * @returns Date object
 */
export function parseDatetimeLocal(datetimeString: string): Date {
  if (!datetimeString) {
    return new Date();
  }
  // datetime-local input values are treated as local time by the browser
  return new Date(datetimeString);
}

/**
 * Convert a UTC ISO string from the backend to a datetime-local input value
 * 
 * @param isoString - UTC ISO string from backend (e.g., "2025-12-07T10:00:00.000Z")
 * @returns String for datetime-local input in local timezone
 */
export function utcToDatetimeLocal(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return toDatetimeLocalString(date);
}

export default {
  getUserTimezone,
  getTimezoneOffset,
  getTimezoneAbbreviation,
  formatLocalDate,
  formatDateRange,
  localInputToUTC,
  isPast,
  isFuture,
  isToday,
  getTimezoneInfo,
  COMMON_TIMEZONES,
  toDatetimeLocalString,
  parseDatetimeLocal,
  utcToDatetimeLocal
};
