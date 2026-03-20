import type {
  SPFxExtensionAppDefinitionConfig,
  SPFxExtensionFolderManifest,
  SPFxExtensionManualAppEntry,
} from "../../models/appFolderManifest";
import type {
  CacheableAppCollectionManifest,
  CacheableAppFolderManifest,
  ManifestBase,
  ManifestLocation,
} from "../../models/cache";
import {
  APPCOLLECTION_MANIFEST_NAME,
  EMPTY_APP_MANIFEST,
  MANIFEST_NAME,
  SPFxExtensionCore,
} from "../../utilities/constants";
import { somethingIsInDebug } from "../../utilities/debug";
import { getContentDigest } from "../../utilities/digest";
import { DEBUG_KEY_APP_PREFIX } from "../../utilities/runtimeConstants";
import { fixupManifest } from "../utility/helpers";
import { getManifestTXTFromCache, setOrUpdateManifestTXT } from "./coreIdbService";
import {
  logGenericCoreDebug,
  logGenericCoreError,
  logGenericCoreInfo,
  logGenericCoreWarning,
} from "./loggingService";

function validateManifestTXT(manifest: SPFxExtensionFolderManifest) {
  if (Array.isArray(manifest) || typeof manifest !== "object") {
    throw `${SPFxExtensionCore} App manifest has to be an object.`;
  }

  if (!manifest.appRelativeEntryPointUrls) {
    logGenericCoreError(`Manifest does not have appRelativeEntryPointUrl property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have appRelativeEntryPointUrl property.`;
  }
  if (!manifest.appDefinitionMap) {
    logGenericCoreError(`Manifest does not have enabledApps property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have enabledApps property.`;
  }
}

/**
 * fetches Manifest from cache, and if it does not exist downloads it and caches for 3600 seconds by default
 * @param url url of the manifest to download
 * @param type type of the manifest related to sharepoint context
 *
 *  ```root``` global
 *
 * ```site``` for site collection
 *
 * ```web``` site collection subsite
 * @param [cacheTimeMinutes] Default is ```60``` to cache for one hour
 */
async function fetchAndCacheManifestTXT(
  manifestBase: Omit<ManifestBase, "hash">,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<CacheableAppFolderManifest> {
  let appManifest = { ...EMPTY_APP_MANIFEST };
  const fetchLocation = manifestBase.url.toLowerCase();
  const isHub = manifestBase.type === "hub";
  if (!skipCache && !somethingIsInDebug) {
    const cachedManifest = await getManifestTXTFromCache(fetchLocation);
    if (cachedManifest) {
      cachedManifest.type = isHub ? "hub" : cachedManifest.type;
      return cachedManifest;
    }
  }
  const fetchUrl = `${fetchLocation}?v=${Date.now()}`;
  try {
    logGenericCoreDebug(`Fetching ${MANIFEST_NAME} from`, fetchUrl);
    const mnfReq = await fetch(fetchUrl);
    const responseText = await mnfReq.text();
    appManifest = JSON.parse(responseText) as SPFxExtensionFolderManifest;
    fixupManifest(appManifest);
  } catch (err) {
    logGenericCoreWarning(`Unable to fetch ${MANIFEST_NAME} from`, fetchUrl, err);
  }
  try {
    validateManifestTXT(appManifest);
  } catch (err) {
    logGenericCoreError(`Error while parsing ${MANIFEST_NAME} from`, fetchUrl, err);
    appManifest = { ...EMPTY_APP_MANIFEST };
  }
  const hash = await getContentDigest(JSON.stringify(appManifest));
  const baseResult = {
    ...manifestBase,
    url: fetchLocation,
    type: isHub ? "site" : manifestBase.type,
    hash,
  };

  const retResult: CacheableAppFolderManifest = {
    manifest: appManifest,
    ...baseResult,
  };

  await setOrUpdateManifestTXT(retResult, somethingIsInDebug ? 1 : cacheTimeMinutes);
  retResult.type = isHub ? "hub" : retResult.type;
  return retResult;
}

/***
 * @param baseUrl should be:
 *
 * Root: ```/sites/appcatalog/CDN/SPFxExtensionApps/```
 *
 * Site: ```/sites/[SomeSite]/SPFxExtensionApps/```
 */
function getManifestTXTLocation(baseUrl: string, appKey: string) {
  const siteLocation = `${baseUrl}${appKey}/${MANIFEST_NAME}`;
  const lsKey = `${DEBUG_KEY_APP_PREFIX}${appKey}`;
  const lsValue = window.localStorage.getItem(lsKey) ?? "";
  const lsValueIsNumber = /^\d+$/.test(lsValue ?? "");
  const lsValueIsString = lsValue.trim() !== "";
  if (lsValueIsNumber) {
    const debugLoc = `https://localhost:${lsValue}/${MANIFEST_NAME}`;
    logGenericCoreInfo(`<${appKey}> App is in debug port mode, loading from`, debugLoc);
    return debugLoc;
  }
  if (lsValueIsString) {
    const debugLoc = `${lsValue}/${MANIFEST_NAME}`;
    logGenericCoreInfo(`<${appKey}> App is in debug url mode, loading from`, debugLoc);
    return debugLoc;
  }
  return siteLocation;
}

function loadManifestTXT(
  appCollectionManifests: CacheableAppCollectionManifest[],
  skipCache = false
) {
  if (appCollectionManifests.length === 0) return [];
  const manifestTXTPromises: Promise<CacheableAppFolderManifest>[] = [];
  for (const appCollectionManifest of appCollectionManifests) {
    const baseUrl = appCollectionManifest.url
      .toLowerCase()
      .replace(APPCOLLECTION_MANIFEST_NAME.toLowerCase(), "");
    for (const appFolderName of appCollectionManifest.manifest.enabledAppCollections) {
      const manifestLocation = getManifestTXTLocation(baseUrl, appFolderName);
      const manifestBase: Omit<ManifestBase, "hash"> = {
        name: appFolderName,
        url: manifestLocation,
        type: appCollectionManifest.type,
      };
      manifestTXTPromises.push(fetchAndCacheManifestTXT(manifestBase, skipCache));
    }
  }
  return manifestTXTPromises;
}

export function getManifestTXTFromAllLocations(
  coreCollection: CacheableAppCollectionManifest[],
  skipCache = false
) {
  const rootAppsCollectionManifest = coreCollection.filter((app) => app.type === "root");
  const rootAppPromises = loadManifestTXT(rootAppsCollectionManifest, skipCache);

  const hubAppsManifest = coreCollection.filter((app) => app.type === "hub");
  const hubAppPromises = loadManifestTXT(hubAppsManifest, skipCache);

  const siteCollectionAppsManifest = coreCollection.filter((app) => app.type === "site");
  const scAppPromises = loadManifestTXT(siteCollectionAppsManifest, skipCache);

  const webAppCollectionManifest = coreCollection.filter((app) => app.type === "web");
  const subsitePromises = loadManifestTXT(webAppCollectionManifest, skipCache);

  const allManifestsTXT = [
    ...rootAppPromises,
    ...hubAppPromises,
    ...scAppPromises,
    ...subsitePromises,
  ];
  return allManifestsTXT;
}
