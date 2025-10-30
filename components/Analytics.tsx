// components/Analytics.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA if not already initialized
    function gtag() {}
    if (!window.GA_INITIALIZED) {
      // Add GA script and initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag("js", new Date());
      gtag("config", "G-SRLNL9FQ0G");
      window.GA_INITIALIZED = true;
    }

    // Track page view on route change
    const handleRouteChange = () => {
      gtag("event", "page_view", {
        page_path: pathname + searchParams.toString(),
      });
    };

    handleRouteChange(); // Initial page view
  }, [pathname, searchParams]);

  return null;
}
