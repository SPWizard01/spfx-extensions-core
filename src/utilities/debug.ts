export const DEBUG_KEYS = {
  /**
   * This key does not point to a specific debug location but is used as a partial key for apps
   */
  SPFXEXT: "SPFXEXT_",
  /**
   * This key points to debug location for the whole App Core
   */
  SPFXEXT_CORE: "SPFXEXT",
} as const;

/**
 * Safe wrapper to access window.localStorage without throwing in non-browser / restricted contexts.
 */
function getLocalStorage(): Storage | undefined {
  // Prefer globalThis.localStorage (what tests mutate) then fall back to window.localStorage.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
    if (g && g.localStorage) return g.localStorage as Storage;
  } catch {
    /* ignored */
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    /* ignored */
  }
  return undefined;
}

function getLocalStorageKeys(): string[] {
  const ls = getLocalStorage();
  if (!ls) return [];
  try {
    const keys: string[] = [];
    // Use Storage API for compatibility instead of Object.keys (which can be empty in some polyfills)
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

function getLocalStorageItem(key: string): string | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  try {
    return ls.getItem(key);
  } catch {
    return null;
  }
}

function inDebug() {
  return getLocalStorageKeys().some(
    (k) => k.indexOf(DEBUG_KEYS.SPFXEXT) > -1 && Number(getLocalStorageItem(k)) > 0
  );
}

export function isFileInDebug(fullUrl: URL) {
  return fullUrl.hostname.toLowerCase() === "localhost";
}

export function isAppInDebug(appName: string) {
  try {
    const key = `${DEBUG_KEYS.SPFXEXT}${appName}`;
    // Prefer Storage.getItem but fall back to direct index access (some shims store values as properties)
    const ls = getLocalStorage();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = ls ? (ls.getItem ? ls.getItem(key) : (ls as any)[key]) : null;
    return Number(raw) > 0;
  } catch {
    return false;
  }
}

// Snapshot at module load; retained for backwards compatibility.
export const isInDebug = inDebug();
// Opt-in dynamic check if consumers need current state without reload.
export function currentDebugState() {
  return inDebug();
}
