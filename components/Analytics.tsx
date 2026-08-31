"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "@/lib/analytics";

function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPageRef = useRef<{
    path: string;
    openedAt: number;
  } | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString() ? `?${searchParams.toString()}` : "";
    const fullPath = `${pathname}${queryString}`;
    const now = Date.now();

    // 1. If leaving a previous page, track page_close and time spent
    if (currentPageRef.current && currentPageRef.current.path !== fullPath) {
      const prev = currentPageRef.current;
      const durationSeconds = (now - prev.openedAt) / 1000;
      analytics.logPageExit(prev.path, durationSeconds);
    }

    // 2. Track new page view & open
    currentPageRef.current = {
      path: fullPath,
      openedAt: now,
    };

    analytics.logPageView(fullPath);
    analytics.logPageEnter(fullPath);
  }, [pathname, searchParams]);

  // Handle tab blur / page unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        if (currentPageRef.current) {
          const durationSeconds = (now - currentPageRef.current.openedAt) / 1000;
          analytics.logPageExit(currentPageRef.current.path, durationSeconds);
        }
      } else if (document.visibilityState === "visible") {
        if (currentPageRef.current) {
          currentPageRef.current.openedAt = now;
          analytics.logPageEnter(currentPageRef.current.path);
        }
      }
    };

    const handleBeforeUnload = () => {
      if (currentPageRef.current) {
        const durationSeconds = (Date.now() - currentPageRef.current.openedAt) / 1000;
        analytics.logPageExit(currentPageRef.current.path, durationSeconds);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (currentPageRef.current) {
        const durationSeconds = (Date.now() - currentPageRef.current.openedAt) / 1000;
        analytics.logPageExit(currentPageRef.current.path, durationSeconds);
      }
    };
  }, []);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
