import type {
  SPFxExtensionAppDefinitionConfig,
  SPFxExtensionFolderManifest,
  SPFxExtensionManualAppEntry,
} from "../../models/appFolderManifest";
import type {
  CacheableAppCollectionManifest,
  CacheableAppFolderManifest,
  ManifestLocation,
} from "../../models/cache";
import {
  APPCOLLECTION_MANIFEST_NAME,
  EMPTY_APP_MANIFEST,
  MANIFEST_NAME,
  SPFxExtensionCore,
} from "../../utilities/constants";
import { DEBUG_KEYS, isInDebug } from "../../utilities/debug";
import { getContentDigest } from "../../utilities/digest";
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
  url: string,
  name: string,
  type: ManifestLocation,
  isHubFetch: boolean,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<CacheableAppFolderManifest> {
  let appManifest = { ...EMPTY_APP_MANIFEST };
  const fetchLocation = url.toLowerCase();
  if (!skipCache && !isInDebug) {
    const cachedManifest = await getManifestTXTFromCache(fetchLocation);
    if (cachedManifest) {
      cachedManifest.isHubFetch = isHubFetch;
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
    name,
    url: fetchLocation,
    type,
    hash,
  };

  const retResult: CacheableAppFolderManifest = {
    manifest: appManifest,
    ...baseResult,
  };

  await setOrUpdateManifestTXT(retResult, isInDebug ? 1 : cacheTimeMinutes);
  retResult.isHubFetch = isHubFetch;
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
  const lsKey = `${DEBUG_KEYS.SPFXEXT}${appKey}`;
  const devSitePort = Number(window.localStorage.getItem(lsKey));
  if (devSitePort > 0) {
    const debugLoc = `https://localhost:${devSitePort}/${MANIFEST_NAME}`;
    logGenericCoreInfo(`<${appKey}> App is in debug mode, loading from`, debugLoc);
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
      manifestTXTPromises.push(
        fetchAndCacheManifestTXT(
          manifestLocation,
          appFolderName,
          appCollectionManifest.type,
          appCollectionManifest.isHubFetch ?? false,
          skipCache
        )
      );
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

  const siteCollectionAppsManifest = coreCollection.filter((app) => app.type === "site");
  const scAppPromises = loadManifestTXT(siteCollectionAppsManifest, skipCache);

  // const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  // let subsitePromises: Promise<ManifestItem>[] = [];
  // if (!siteIsWeb) {
  const webAppCollectionManifest = coreCollection.filter((app) => app.type === "web");
  const subsitePromises = loadManifestTXT(webAppCollectionManifest, skipCache);
  //}

  //foreach app do stuff
  const allManifestsTXT = [...rootAppPromises, ...scAppPromises, ...subsitePromises];
  return allManifestsTXT;
}
