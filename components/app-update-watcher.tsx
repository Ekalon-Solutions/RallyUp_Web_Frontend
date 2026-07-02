"use client";

import { useEffect, useRef } from "react";
import { checkForAppUpdate, setupStaleBuildRecovery } from "@/lib/chunk-reload";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function AppUpdateWatcher() {
  const checkingRef = useRef(false);

  useEffect(() => {
    setupStaleBuildRecovery();
  }, []);

  useEffect(() => {
    const runCheck = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        await checkForAppUpdate();
      } finally {
        checkingRef.current = false;
      }
    };

    void runCheck();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runCheck();
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
