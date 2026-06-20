'use client';

import { ShieldX, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openVendorSupportWhatsApp } from '@/lib/vendorSupport';

type VendorNotAuthorizedProps = {
  phoneLabel?: string;
  onTryDifferentNumber?: () => void;
};

export function VendorNotAuthorized({ phoneLabel, onTryDifferentNumber }: VendorNotAuthorizedProps) {
  return (
    <div className="public-theme flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
        <ShieldX className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Not Authorized</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
        {phoneLabel
          ? `${phoneLabel} is not on the pre-approved vendor list for this club.`
          : 'This account is not on the pre-approved vendor list.'}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
        Ask your Club Admin to add you as a vendor with your name, email, and mobile number. Once
        approved, return here and sign in with the same email or number.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {onTryDifferentNumber ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
            onClick={onTryDifferentNumber}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Try again
          </Button>
        ) : null}
        <Button
          type="button"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => openVendorSupportWhatsApp({ issue: 'Not authorized — need vendor access' })}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}
