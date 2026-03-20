import { DEBUG_KEY_APP_PREFIX, DEBUG_KEY_CORE } from "./runtimeConstants";

function getLocalStorageKeys(): string[] {
  try {
    const keys: string[] = [];
    // Use Storage API for compatibility instead of Object.keys (which can be empty in some polyfills)
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

function getLocalStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function someAppsInDebug() {
  return getLocalStorageKeys().some((k) => {
    const hasCoreKey = k.indexOf(DEBUG_KEY_CORE) > -1;
    const lsValue = getLocalStorageItem(k) ?? "";
    const lsValueIsNumber = /^\d+$/.test(lsValue);
    const lsValueIsString = lsValue.trim() !== "";
    return hasCoreKey && (lsValueIsNumber || lsValueIsString);
  });
}

export function appIsInDebug(appName: string) {
  try {
    const key = `${DEBUG_KEY_APP_PREFIX}${appName}`;
    const lsValue = window.localStorage.getItem(key)?.trim() ?? "";
    const lsValueIsNumber = /^\d+$/.test(lsValue ?? "");
    const lsValueIsString = lsValue.trim() !== "";
    if (lsValueIsNumber) {
      return Number(lsValue) > 0;
    }
    return lsValueIsString;
  } catch {
    return false;
  }
}

// Snapshot at module load; retained for backwards compatibility.
export const somethingIsInDebug = someAppsInDebug();
