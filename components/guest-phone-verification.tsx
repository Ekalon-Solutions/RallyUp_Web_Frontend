'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountryCodeSelect } from '@/components/country-code-select';
import { apiClient } from '@/lib/api';

export function normalizeCountryCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '+91';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export type GuestVerification = {
  guestToken: string;
  phoneDigits: string;
  countryCode: string;
};

type Props = {
  heading: string;
  subheading: string;
  onVerified: (verification: GuestVerification) => void | Promise<void>;
};

/** Phone-number → WhatsApp OTP verification, shared by the guest refund and venue-switch flows. */
export function GuestPhoneVerification({ heading, subheading, onVerified }: Props) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionInfo, setSessionInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const digits = useMemo(() => phoneNumber.replace(/\D/g, ''), [phoneNumber]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

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
        await onVerified({
          guestToken: res.data.guestToken,
          phoneDigits: digits,
          countryCode: normalizeCountryCode(countryCode),
        });
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

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm text-zinc-400">{subheading}</p>
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
    );
  }

  return (
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
  );
}
