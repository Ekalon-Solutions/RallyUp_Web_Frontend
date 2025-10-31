// components/Analytics.tsx
"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Extend Window interface for GA
declare global {
  interface Window {
    GA_INITIALIZED?: boolean;
    dataLayer?: any[];
  }
}

function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA if not already initialized
    if (typeof window !== 'undefined' && !window.GA_INITIALIZED) {
      // Add GA script and initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer?.push(args);
      }
      gtag("js", new Date());
      gtag("config", "G-SRLNL9FQ0G");
      window.GA_INITIALIZED = true;
    }

    // Track page view on route change
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: "page_view",
        page_path: pathname + searchParams.toString(),
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
