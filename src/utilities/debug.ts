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

function inDebug() {
  return Object.keys(localStorage).some(
    (k) => k.indexOf(DEBUG_KEYS.SPFXEXT) > -1 && Number(localStorage[k]) > 0
  );
}

export function isFileInDebug(fullUrl: URL) {
  return fullUrl.hostname.toLowerCase() === "localhost";
}

export function isAppInDebug(appName: string) {
  return Number(localStorage.getItem(`${DEBUG_KEYS.SPFXEXT}${appName}`)) > 0;
}

export const isInDebug = inDebug();
