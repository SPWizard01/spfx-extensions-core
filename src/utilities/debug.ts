export const DEBUG_KEYS = {
  /**
   * This key does not point to a specific debug location but is used as a partial key for apps
   */
  SPFXEXT: "SPFXEXT_",
  /**
   * This key points to debug location for the whole App Core
   */
  SPFXEXT_CORE: "SPFXEXT_CORE",
} as const;

function inDebug() {
  return Object.keys(localStorage).some(
    (k) => k.indexOf(DEBUG_KEYS.SPFXEXT) > -1 && Number(localStorage[k]) > 0
  );
}

export function isFileInDebug(fullUrl: string) {
  const lower = fullUrl.toLowerCase();
  return lower.indexOf("https://localhost") > -1 || lower.indexOf("http://localhost") > -1;
}

export function isAppInDebug(appId: string) {
  return Object.keys(localStorage).some(
    (k) => k.indexOf(`${DEBUG_KEYS.SPFXEXT}${appId}`) > -1 && Number(localStorage[k]) > 0
  );
}


export const isInDebug = inDebug();
