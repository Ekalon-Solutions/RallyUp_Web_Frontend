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

export function readCurrentBuildId(): string {
  if (typeof window !== "undefined") {
    const meta = document.querySelector('meta[name="app-build-id"]')?.getAttribute("content");
    if (meta) return meta;
  }
  return process.env.NEXT_PUBLIC_APP_BUILD_ID || "";
}

export async function fetchLatestBuildId(): Promise<string | null> {
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { buildId?: string };
    return data.buildId ?? null;
  } catch {
    return null;
  }
}

export function clearStaleBuildReloadAttempt(): void {
  sessionStorage.removeItem(RELOAD_ATTEMPT_KEY);
}

export function reloadOnceOnChunkFailure(): boolean {
  if (sessionStorage.getItem(RELOAD_ATTEMPT_KEY)) {
    return false;
  }
  sessionStorage.setItem(RELOAD_ATTEMPT_KEY, String(Date.now()));
  window.location.reload();
  return true;
}

export function reloadForNewBuild(): void {
  window.location.reload();
}

export async function checkForAppUpdate(): Promise<boolean> {
  const latest = await fetchLatestBuildId();
  if (!latest) return false;
  const current = readCurrentBuildId();
  if (!current || latest === current) return false;
  reloadForNewBuild();
  return true;
}

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
