'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import QuickScannerPageInner from './page-inner';

export default function QuickScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        </div>
      }
    >
      <QuickScannerPageInner />
    </Suspense>
  );
}
