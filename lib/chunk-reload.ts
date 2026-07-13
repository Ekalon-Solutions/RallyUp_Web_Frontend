const RELOAD_ATTEMPT_KEY = "app_stale_build_reload_attempted";

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String((error as { message?: string })?.message ?? error ?? "");

  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Loading CSS chunk [\d]+ failed/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

function clearStaleBuildReloadAttempt(): void {
  sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
}

function reloadOnceOnChunkFailure(): boolean {
  if (sessionStorage.getItem(RELOAD_ATTEMPT_KEY)) {
    return false;
  }
  sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(Date.now()));
  window.location.reload();
  return true;
}

/** Reloads once when a stale JS/CSS chunk fails after a deployment. */
export function setupStaleBuildRecovery(): void {
  clearStaleBuildReloadAttempt();

  window.addEventListener("error", (event) => {
    const candidate = event.error ?? event.message;
    if (isChunkLoadError(candidate)) {
      reloadOnceOnChunkFailure();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    reloadOnceOnChunkFailure();
  });
}
