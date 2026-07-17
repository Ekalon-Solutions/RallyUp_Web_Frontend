'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { GuestPhoneVerification, type GuestVerification } from '@/components/guest-phone-verification';

type GuestTicket = {
  eventId: string;
  eventTitle: string;
  eventStartTime?: string;
  venue?: string;
  attendeeId: string;
  attendeeName: string;
  price?: number;
};

type Step = 'verify' | 'tickets' | 'done';

export default function ClubGuestRefundsPage() {
  const params = useParams();
  const clubSlug = String(params?.slug || '');

  const [step, setStep] = useState<Step>('verify');
  const [auth, setAuth] = useState<GuestVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [clubName, setClubName] = useState<string>('');
  const [clubId, setClubId] = useState<string>('');
  const [tickets, setTickets] = useState<GuestTicket[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cancelledCount, setCancelledCount] = useState(0);

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

  const loadTickets = async (verification: GuestVerification) => {
    if (!clubId) {
      toast.error('Could not load club information');
      return;
    }
    setAuth(verification);
    const res = await apiClient.listGuestRefundTickets({
      clubSlug,
      phoneNumber: verification.phoneDigits,
      countryCode: verification.countryCode,
      guestToken: verification.guestToken,
    });
    if (!res.success || !res.data) {
      toast.error(res.error || res.message || 'Could not fetch your tickets');
      return;
    }
    setClubName(res.data.club?.name || '');
    setTickets(res.data.tickets || []);
    setStep('tickets');
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
    if (!clubId || !auth) {
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
        phoneNumber: auth.phoneDigits,
        countryCode: auth.countryCode,
        guestToken: auth.guestToken,
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
        {step === 'verify' && (
          <GuestPhoneVerification
            heading="Cancel your ticket"
            subheading="Enter the mobile number you used to book your ticket(s)."
            onVerified={loadTickets}
          />
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
