'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Smartphone, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CountryCodeSelect } from '@/components/country-code-select';
import { apiClient } from '@/lib/api';

type GuestTicket = {
  eventId: string;
  eventTitle: string;
  eventStartTime?: string;
  venue?: string;
  attendeeId: string;
  attendeeName: string;
  price?: number;
};

type Step = 'phone' | 'otp' | 'tickets' | 'done';

function normalizeCountryCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '+91';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function ClubGuestRefundsPage() {
  const params = useParams();
  const clubSlug = String(params?.slug || '');

  const [step, setStep] = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');
  const [guestToken, setGuestToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [clubName, setClubName] = useState<string>('');
  const [clubId, setClubId] = useState<string>('');
  const [tickets, setTickets] = useState<GuestTicket[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cancelledCount, setCancelledCount] = useState(0);

  const digits = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber]);
  const ticketKey = (t: GuestTicket) => `${t.eventId}:${t.attendeeId}`;

  useEffect(() => {
    const fetchClub = async () => {
      const res = await apiClient.getClubById(clubSlug, true);
      if (res.success && res.data) {
        setClubId(res.data._id);
      }
    };
    if (clubSlug) {
      fetchClub();
    }
  }, [clubSlug]);

  const sendOtp = useCallback(async () => {
    if (digits.length < 6) {
      toast.error('Enter a valid mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.sendGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
      });
      if (res.success && res.data?.sessionInfo) {
        setSessionInfo(res.data.sessionInfo);
        setStep('otp');
        setResendSeconds(30);
        toast.success('Verification code sent via WhatsApp');
        return;
      }
      toast.error(res.error || res.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  }, [countryCode, digits]);

  const loadTickets = useCallback(
    async (token: string) => {
      if (!clubId) {
        toast.error('Could not load club information');
        return;
      }
      const res = await apiClient.listGuestRefundTickets({
        clubSlug,
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
        guestToken: token,
      });
      if (!res.success || !res.data) {
        toast.error(res.error || res.message || 'Could not fetch your tickets');
        return;
      }
      setClubName(res.data.club?.name || '');
      setTickets(res.data.tickets || []);
      setStep('tickets');
    },
    [clubId, countryCode, digits]
  );

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.verifyGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
        otp,
        sessionInfo,
      });
      if (res.success && res.data?.verified && res.data.guestToken) {
        setGuestToken(res.data.guestToken);
        await loadTickets(res.data.guestToken);
        return;
      }
      toast.error(res.error || res.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendSeconds > 0) return;
    setLoading(true);
    try {
      const res = await apiClient.resendGuestPhoneVerificationOTP({
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
      });
      if (res.success && res.data?.sessionInfo) {
        setSessionInfo(res.data.sessionInfo);
        setResendSeconds(30);
        toast.success('Verification code resent');
      } else {
        toast.error(res.error || res.message || 'Could not resend code');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (t: GuestTicket) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = ticketKey(t);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submitCancellation = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one ticket to cancel');
      return;
    }
    if (!clubId) {
      toast.error('Could not load club information');
      return;
    }
    setLoading(true);
    try {
      const items = tickets
        .filter((t) => selected.has(ticketKey(t)))
        .map((t) => ({ eventId: t.eventId, attendeeId: t.attendeeId }));

      const res = await apiClient.requestGuestRefund({
        clubSlug,
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
        guestToken,
        items,
      });

      if (res.success && res.data) {
        setCancelledCount(res.data.cancelledCount);
        setStep('done');
        return;
      }

      if (res.data && (res.data as any).code === 'OUTSIDE_CANCELLATION_WINDOW') {
        toast.error(res.message || res.error || '');
        return;
      }

      toast.error(res.error || res.message || 'Could not process cancellation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-theme flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      <header className="flex items-center gap-2 px-4 py-4">
        <Ticket className="h-6 w-6 text-primary" />
        <span className="font-semibold">{clubName || 'Ticket Cancellation'}</span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-10">
        {step === 'phone' && (
          <div className="space-y-4">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Cancel your ticket</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Enter the mobile number you used to book your ticket(s).
              </p>
            </div>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onValueChange={setCountryCode}
                variant="login"
                className="w-24 border-zinc-800 bg-zinc-900"
              />
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))}
                placeholder="Mobile number"
                inputMode="tel"
                autoComplete="tel"
                className="flex-1 border-zinc-800 bg-zinc-900 text-white"
              />
            </div>
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              onClick={sendOtp}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send verification code'}
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-center text-sm text-zinc-400">
              Enter the 6-digit code sent to{' '}
              <span className="text-zinc-200">
                {normalizeCountryCode(countryCode)} {phoneNumber}
              </span>
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="border-zinc-800 bg-zinc-900 text-center text-2xl tracking-[0.4em] text-white"
            />
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading || otp.length !== 6}
              onClick={verifyOtp}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white"
              disabled={loading || resendSeconds > 0}
              onClick={resendOtp}
            >
              {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
            </Button>
          </div>
        )}

        {step === 'tickets' && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Your tickets</h1>
            {tickets.length === 0 ? (
              <p className="text-sm text-zinc-400">No active tickets found for this mobile number.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => {
                  const key = ticketKey(t);
                  return (
                    <Card
                      key={key}
                      className="flex items-start gap-3 border-zinc-800 bg-zinc-900 p-4"
                    >
                      <Checkbox
                        checked={selected.has(key)}
                        onCheckedChange={() => toggleSelected(t)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{t.eventTitle}</p>
                        <p className="text-xs text-zinc-400">{t.attendeeName}</p>
                        {t.eventStartTime && (
                          <p className="text-xs text-zinc-500">
                            {new Date(t.eventStartTime).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                        {t.venue && <p className="text-xs text-zinc-500">{t.venue}</p>}
                      </div>
                    </Card>
                  );
                })}
                <Button
                  type="button"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading || selected.size === 0}
                  onClick={submitCancellation}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel and Request Refund'}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-xl font-semibold">Cancellation requested</h1>
            <p className="text-sm text-zinc-400">
              {cancelledCount} ticket{cancelledCount === 1 ? '' : 's'} cancelled. We&apos;ll email you a
              confirmation, and your refund will be processed once our admin team confirms the
              cancellation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
