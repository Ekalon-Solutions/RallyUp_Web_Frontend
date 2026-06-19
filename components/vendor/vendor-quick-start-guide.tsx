'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ScanLine, Flashlight, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SLIDES = [
  {
    title: 'Scan tickets fast',
    description:
      'Point your camera at the guest QR code. A green overlay means valid — tap Confirm to check them in.',
    icon: ScanLine,
  },
  {
    title: 'Toggle the flash',
    description:
      'In low light, tap the flashlight icon at the bottom of the scanner. Tap again to turn it off.',
    icon: Flashlight,
  },
  {
    title: 'Fix common scan errors',
    description:
      'Already scanned, wrong gate, or not checked in? Read the red message on screen. Switch assignment or use Help if stuck.',
    icon: AlertCircle,
  },
] as const;

type VendorQuickStartGuideProps = {
  onComplete: () => void;
};

export function VendorQuickStartGuide({ onComplete }: VendorQuickStartGuideProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="flex min-h-[420px] flex-col">
      <div className="mb-6 flex justify-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <Image
            src="/logo.png"
            alt="RallyUp"
            fill
            className="object-contain p-4 opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-emerald-400' : 'w-1.5 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      <h2 className="mt-6 text-center text-xl font-semibold text-white">{slide.title}</h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">{slide.description}</p>

      <div className="mt-auto flex gap-3 pt-8">
        {index > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        <Button
          type="button"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500"
          onClick={() => {
            if (isLast) onComplete();
            else setIndex((i) => i + 1);
          }}
        >
          {isLast ? 'Start scanning' : 'Next'}
          {!isLast ? <ChevronRight className="ml-1 h-4 w-4" /> : null}
        </Button>
      </div>
    </div>
  );
}
