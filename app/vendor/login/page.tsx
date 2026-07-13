'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, MessageCircle, ScanLine, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountryCodeSelect } from '@/components/country-code-select';
import { VendorNotAuthorized } from '@/components/vendor/vendor-not-authorized';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { isVendorOnboardingComplete } from '@/lib/vendorOnboarding';
import { openVendorSupportWhatsApp } from '@/lib/vendorSupport';

declare global {
  interface Window {
    vendorOtpSessionInfo?: string;
  }
}

type LoginMethod = 'phone' | 'email';

function normalizeCountryCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '+91';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function formatPhoneLabel(countryCode: string, phoneNumber: string): string {
  return `${normalizeCountryCode(countryCode)} ${phoneNumber.trim()}`;
}

export default function VendorLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, checkAuth } = useAuth();

  const [method, setMethod] = useState<LoginMethod>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState<string>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const phoneLabel = useMemo(
    () => (phoneNumber.trim() ? formatPhoneLabel(countryCode, phoneNumber) : undefined),
    [countryCode, phoneNumber]
  );
  const targetLabel = method === 'email' ? email.trim() || undefined : phoneLabel;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'vendor') return;
    const userId = String((user as any)?._id || '');
    if (isVendorOnboardingComplete(userId)) {
      router.replace('/dashboard/quick-scanner');
    } else {
      router.replace('/vendor/onboarding');
    }
  }, [authLoading, isAuthenticated, router, user]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const handleUnauthorized = useCallback((message?: string) => {
    setNotAuthorized(true);
    if (message) toast.error(message);
  }, []);

  const switchMethod = (next: LoginMethod) => {
    setMethod(next);
    setOtpSent(false);
    setOtp('');
    setResendSeconds(0);
  };

  const sendOtp = useCallback(
    async (channel?: 'whatsapp' | 'sms') => {
      const digits = phoneNumber.replace(/\D/g, '');
      if (!digits || digits.length < 8) {
        toast.error('Enter a valid mobile number');
        return;
      }

      setLoading(true);
      try {
        const res = await apiClient.sendVendorOtp({
          phoneNumber: digits,
          countryCode: normalizeCountryCode(countryCode),
          channel,
        });

        if (res.success && res.data?.sessionInfo) {
          window.vendorOtpSessionInfo = res.data.sessionInfo;
          setOtpSent(true);
          setDeliveryChannel(res.data.deliveryChannel || channel || 'whatsapp');
          setResendSeconds(30);
          toast.success(
            res.data.deliveryChannel === 'sms'
              ? 'Verification code sent via SMS'
              : 'Verification code sent via WhatsApp'
          );
          return;
        }

        const code = (res.data as any)?.code;
        if (code === 'NOT_AUTHORIZED' || (res.status === 403 && code === 'NOT_AUTHORIZED')) {
          handleUnauthorized();
          return;
        }

        toast.error(res.error || res.message || 'Could not send verification code');
      } catch {
        toast.error('Could not send verification code');
      } finally {
        setLoading(false);
      }
    },
    [countryCode, handleUnauthorized, phoneNumber]
  );

  const sendEmailOtp = useCallback(async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.sendVendorEmailOtp({ email: trimmed });

      if (res.success) {
        setOtpSent(true);
        setDeliveryChannel('email');
        setResendSeconds(30);
        toast.success('Verification code sent to your email');
        return;
      }

      const code = (res.data as any)?.code;
      if (code === 'NOT_AUTHORIZED' || (res.status === 403 && code === 'NOT_AUTHORIZED')) {
        handleUnauthorized();
        return;
      }

      toast.error(res.error || res.message || 'Could not send verification code');
    } catch {
      toast.error('Could not send verification code');
    } finally {
      setLoading(false);
    }
  }, [email, handleUnauthorized]);

  const completeLogin = async (data: { token: string; _id?: string | number }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', 'vendor');
    await checkAuth();
    const userId = String(data._id || '');
    if (isVendorOnboardingComplete(userId)) {
      router.replace('/dashboard/quick-scanner');
    } else {
      router.replace('/vendor/onboarding');
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      if (method === 'email') {
        const res = await apiClient.verifyVendorEmailOtpAndLogin({ email: email.trim(), otp });
        if (res.success && res.data?.token) {
          await completeLogin(res.data);
          return;
        }
        const code = (res.data as any)?.code;
        if (code === 'NOT_AUTHORIZED') {
          handleUnauthorized();
          return;
        }
        toast.error(res.error || res.message || 'Invalid or expired code');
        return;
      }

      const digits = phoneNumber.replace(/\D/g, '');
      const sessionInfo = window.vendorOtpSessionInfo;
      if (!digits || !sessionInfo) {
        toast.error('Enter the 6-digit code');
        return;
      }
      const res = await apiClient.verifyVendorOtpAndLogin({
        phoneNumber: digits,
        countryCode: normalizeCountryCode(countryCode),
        otp,
        sessionInfo,
      });

      if (res.success && res.data?.token) {
        await completeLogin(res.data);
        return;
      }

      const code = (res.data as any)?.code;
      if (code === 'NOT_AUTHORIZED') {
        handleUnauthorized();
        return;
      }

      toast.error(res.error || res.message || 'Invalid or expired code');
    } catch {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = () => {
    if (method === 'email') {
      void sendEmailOtp();
    } else {
      void sendOtp(deliveryChannel === 'sms' ? 'sms' : 'whatsapp');
    }
  };

  if (notAuthorized) {
    return (
      <VendorNotAuthorized
        phoneLabel={targetLabel}
        onTryDifferentNumber={() => {
          setNotAuthorized(false);
          setOtpSent(false);
          setOtp('');
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="public-theme flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="public-theme flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" />
          <span className="font-semibold">Bouncer Login</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-zinc-300 hover:bg-zinc-900 hover:text-white"
          onClick={() => openVendorSupportWhatsApp()}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Help &amp; Support
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            {method === 'email' ? (
              <Mail className="h-7 w-7 text-primary" />
            ) : (
              <Smartphone className="h-7 w-7 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to scan</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Passwordless login for pre-approved venue staff. No account setup required.
          </p>
        </div>

        {!otpSent && (
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => switchMethod('phone')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                method === 'phone'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Phone
            </button>
            <button
              type="button"
              onClick={() => switchMethod('email')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                method === 'email'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>
        )}

        {!otpSent ? (
          method === 'phone' ? (
            <div className="space-y-4">
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
                onClick={() => sendOtp('whatsapp')}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send code via WhatsApp'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
                disabled={loading}
                onClick={() => sendOtp('sms')}
              >
                Send code via SMS instead
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="border-zinc-800 bg-zinc-900 text-white"
                aria-label="Email address"
              />
              <Button
                type="button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
                onClick={() => sendEmailOtp()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send code via email'}
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-zinc-400">
              Enter the 6-digit code sent to <span className="text-zinc-200">{targetLabel}</span>
              {deliveryChannel ? ` via ${deliveryChannel}` : ''}
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
            <Button
              type="button"
              variant="ghost"
              className="w-full text-zinc-500"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
              }}
            >
              {method === 'email' ? 'Change email' : 'Change number'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
