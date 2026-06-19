'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import QuickScannerPageInner from './page-inner';

export default function QuickScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        </div>
      }
    >
      <QuickScannerPageInner />
    </Suspense>
  );
}
