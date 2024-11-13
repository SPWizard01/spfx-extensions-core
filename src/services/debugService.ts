/**
 * CURRENTLY NOT USED, NOT TESTED
 */

import type { SPFxExtensionAppManifest } from "../models/appModel";
import { DEBUG_KEYS } from "../utilities/debug";

/**
 * Checks localstorage for any of the keys that start with `SPFXEXT_` and returns true if any of the values is greater than 0
 * @returns true if any of the localStorage items with a given key is Number and is greater than 0
 */
export function debuggingEnabled() {
  const debugKeys = Object.keys(localStorage).filter(
    (k) => k.indexOf(DEBUG_KEYS.SPFXEXT) > -1
  );
  for (const key of debugKeys) {
    const value = localStorage.getItem(key);
    if (Number(value) > 0) {
      return true;
    }
  }
  return false;
}

export function addESBuildDebugging(debugKey: string, prodPublicPath: string) {
  if (!debugKey) {
    throw "Debug key cannot be empty";
  }
  if (typeof prodPublicPath == undefined || typeof prodPublicPath == null) {
    throw "Prod public path cannot be undefined or null";
  }
  const key = `${DEBUG_KEYS.SPFXEXT}${debugKey}`;
  const devPort = Number(localStorage.getItem(key));
  const devPublicPath = `https://localhost:${devPort}/`;
  const esbuildPublicPath = devPort > 0 ? devPublicPath : prodPublicPath;
  console.debug(`[${key}] ESM Public path is set to ${esbuildPublicPath}`);
  return esbuildPublicPath;
}

export async function startAppWithESDebugging(
  debugKey: string,
  prodPublicPath: string
) {
  const pubPath = addESBuildDebugging(debugKey, prodPublicPath);
  const manifest = await fetch(`${pubPath}/manifest.txt`);
  const manifestData = await manifest.text();
  const manifestJson = JSON.parse(manifestData) as SPFxExtensionAppManifest;
  const modulePath = `${pubPath}/${manifestJson.appRelativeEntryPointUrl}`;
  console.debug(`[${debugKey}] Importing module ${modulePath}`);
  await import(modulePath);
}

export async function startAppDirectlyWithESDebugging(
  debugKey: string,
  prodPublicPath: string,
  entryPointJs: string
) {
  const pubPath = addESBuildDebugging(debugKey, prodPublicPath);
  const importPath = `${pubPath}/${entryPointJs}`;
  await import(importPath);
}
