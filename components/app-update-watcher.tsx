"use client";

import { useEffect } from "react";
import { setupStaleBuildRecovery } from "@/lib/chunk-reload";

/** Recovers from stale chunk errors after a deploy (no version polling). */
export function AppUpdateWatcher() {
  useEffect(() => {
    setupStaleBuildRecovery();
  }, []);

  return null;
}
