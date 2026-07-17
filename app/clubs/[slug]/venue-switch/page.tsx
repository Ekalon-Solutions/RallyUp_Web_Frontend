'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, MapPin, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { GuestPhoneVerification, type GuestVerification } from '@/components/guest-phone-verification';

type SwitchableTicket = {
  eventId: string;
  eventTitle: string;
  eventStartTime?: string;
  attendeeId: string;
  attendeeName: string;
  currentVenueName: string;
  targets: Array<{
    venueId: string;
    venueName: string;
    tierId: string;
    tierName: string;
    price: number;
    seatsLeft: number;
  }>;
};

type Step = 'verify' | 'tickets' | 'targets' | 'done';

export default function ClubGuestVenueSwitchPage() {
  const params = useParams();
  const clubSlug = String(params?.slug || '');

  const [step, setStep] = useState<Step>('verify');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<GuestVerification | null>(null);
  const [tickets, setTickets] = useState<SwitchableTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SwitchableTicket | null>(null);
  const [result, setResult] = useState<{ venueName: string; tierName: string; attendeeName: string } | null>(null);

  /** Loads the caller's tickets, then keeps only the ones the club has actually opened for switching. */
  const loadSwitchableTickets = async (verification: GuestVerification) => {
    setAuth(verification);
    setLoading(true);
    try {
      const base = {
        clubSlug,
        phoneNumber: verification.phoneDigits,
        countryCode: verification.countryCode,
        guestToken: verification.guestToken,
      };

      const listed = await apiClient.listGuestRefundTickets(base);
      if (!listed.success || !listed.data) {
        toast.error(listed.error || listed.message || 'Could not fetch your tickets');
        return;
      }

      const withOptions = await Promise.all(
        (listed.data.tickets || []).map(async (t) => {
          const opts = await apiClient.listGuestVenueSwitchOptions({
            ...base,
            eventId: t.eventId,
            attendeeId: t.attendeeId,
          });
          if (!opts.success || !opts.data || opts.data.targets.length === 0) return null;
          return {
            eventId: t.eventId,
            eventTitle: t.eventTitle,
            eventStartTime: t.eventStartTime,
            attendeeId: t.attendeeId,
            attendeeName: t.attendeeName,
            currentVenueName: opts.data.currentVenueName,
            targets: opts.data.targets,
          } as SwitchableTicket;
        })
      );

      setTickets(withOptions.filter((t): t is SwitchableTicket => t !== null));
      setStep('tickets');
    } finally {
      setLoading(false);
    }
  };

  const submitSwitch = async (target: SwitchableTicket['targets'][number]) => {
    if (!auth || !activeTicket) return;
    setLoading(true);
    try {
      const res = await apiClient.requestGuestVenueSwitch({
        clubSlug,
        phoneNumber: auth.phoneDigits,
        countryCode: auth.countryCode,
        guestToken: auth.guestToken,
        eventId: activeTicket.eventId,
        attendeeId: activeTicket.attendeeId,
        targetVenueId: target.venueId,
        targetTierId: target.tierId,
      });

      if (res.success && res.data) {
        setResult({
          venueName: res.data.venueName,
          tierName: res.data.tierName,
          attendeeName: res.data.attendeeName,
        });
        setStep('done');
        return;
      }
      toast.error(res.error || res.message || 'Could not switch venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-theme flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      <header className="flex items-center gap-2 px-4 py-4">
        <Ticket className="h-6 w-6 text-primary" />
        <span className="font-semibold">Change your venue</span>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-10">
        {step === 'verify' && (
          <GuestPhoneVerification
            heading="Change your venue"
            subheading="Enter the mobile number you used to book your ticket(s)."
            onVerified={loadSwitchableTickets}
          />
        )}

        {step === 'tickets' && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Your tickets</h1>
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-400" />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-zinc-400">
                None of your tickets can be moved to another venue right now. If you think this is a
                mistake, please contact the club.
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <Card
                    key={`${t.eventId}:${t.attendeeId}`}
                    className="border-zinc-800 bg-zinc-900 p-4"
                  >
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
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" /> Currently at {t.currentVenueName}
                    </p>
                    <Button
                      type="button"
                      className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setActiveTicket(t);
                        setStep('targets');
                      }}
                    >
                      Switch venue
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'targets' && activeTicket && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">Pick a new venue</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {activeTicket.attendeeName} — currently at {activeTicket.currentVenueName}
              </p>
            </div>
            <div className="space-y-3">
              {activeTicket.targets.map((target) => (
                <Card
                  key={`${target.venueId}:${target.tierId}`}
                  className="flex items-center justify-between gap-3 border-zinc-800 bg-zinc-900 p-4"
                >
                  <div>
                    <p className="font-medium">{target.venueName}</p>
                    <p className="text-xs text-zinc-400">{target.tierName}</p>
                    <p className="text-xs text-zinc-500">{target.seatsLeft} seats left</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                    onClick={() => submitSwitch(target)}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Move here'}
                  </Button>
                </Card>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white"
              disabled={loading}
              onClick={() => setStep('tickets')}
            >
              Back
            </Button>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-xl font-semibold">Venue changed</h1>
            <Card className="border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Your new venue</p>
              <p className="mt-1 text-2xl font-semibold text-primary">{result.venueName}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {result.tierName} — {result.attendeeName}
              </p>
            </Card>
            {/* The club is not sending any confirmation message for switches, so this screen is the
                attendee's only record of the new venue — say so plainly rather than implying one is coming. */}
            <p className="text-sm text-zinc-400">
              Please take a screenshot of this screen. Your original ticket QR code still works — keep
              using it for entry, even though it shows the old venue name.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
