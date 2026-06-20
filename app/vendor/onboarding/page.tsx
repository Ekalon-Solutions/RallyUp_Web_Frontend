'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { VendorPermissionCheck } from '@/components/vendor/vendor-permission-check';
import { VendorQuickStartGuide } from '@/components/vendor/vendor-quick-start-guide';
import { useAuth } from '@/contexts/auth-context';
import { isVendorOnboardingComplete, markVendorOnboardingComplete } from '@/lib/vendorOnboarding';
import { silentSyncVendorGuestList } from '@/lib/vendorOfflineSync';

type OnboardingStep = 'permissions' | 'guide' | 'syncing';

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('permissions');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== 'vendor') {
      router.replace('/vendor/login');
      return;
    }
    const userId = String((user as any)?._id || '');
    if (isVendorOnboardingComplete(userId)) {
      router.replace('/dashboard/quick-scanner');
    }
  }, [isAuthenticated, isLoading, router, user]);

  const finishOnboarding = async () => {
    const userId = String((user as any)?._id || '');
    if (!userId) return;

    setStep('syncing');
    markVendorOnboardingComplete(userId);
    silentSyncVendorGuestList().finally(() => {
      router.replace('/dashboard/quick-scanner');
    });
  };

  if (isLoading || !isAuthenticated || user?.role !== 'vendor') {
    return (
      <div className="public-theme flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="public-theme flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 py-8 text-white">
      <div className="w-full max-w-md">
        {step === 'permissions' ? (
          <VendorPermissionCheck onReady={() => setStep('guide')} />
        ) : null}

        {step === 'guide' ? (
          <VendorQuickStartGuide onComplete={finishOnboarding} />
        ) : null}

        {step === 'syncing' ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-zinc-400">Preparing offline guest list…</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
