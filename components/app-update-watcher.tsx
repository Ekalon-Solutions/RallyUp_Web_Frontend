"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { checkForAppUpdate, setupStaleBuildRecovery } from "@/lib/chunk-reload";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function AppUpdateWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkingRef = useRef(false);
  const search = searchParams?.toString() || "";

  useEffect(() => {
    setupStaleBuildRecovery();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        if (!cancelled) {
          await checkForAppUpdate();
        }
      } finally {
        checkingRef.current = false;
      }
    };

    void runCheck();

    return () => {
      cancelled = true;
    };
  }, [pathname, search]);

  useEffect(() => {
    const runCheck = () => {
      void checkForAppUpdate();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runCheck();
      }
    };

    window.addEventListener("focus", runCheck);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const intervalId = window.setInterval(runCheck, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", runCheck);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
