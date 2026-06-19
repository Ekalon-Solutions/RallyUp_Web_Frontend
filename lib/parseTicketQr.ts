export function parseTicketQr(raw: string): { registrationId: string; attendeeId: string } | null {
  if (!raw?.trim()) return null;
  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://x.invalid/?${raw}`);
    const registrationId = url.searchParams.get('registrationId');
    const attendeeId = url.searchParams.get('attendeeId');
    if (registrationId && attendeeId) return { registrationId, attendeeId };
  } catch {
    /* ignore */
  }
  return null;
}

export function ticketCacheKey(registrationId: string, attendeeId: string): string {
  return `${registrationId}:${attendeeId}`;
}
