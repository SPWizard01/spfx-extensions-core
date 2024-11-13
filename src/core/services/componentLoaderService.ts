import {
  SPFxExtensionCore,
} from "../../utilities/constants";
import { getContentDigest } from "../../utilities/digest";
import { isFileAllowedInCurrentWeb } from "./allowedAppsService";

import { DEBUG_KEYS, isInDebug } from "../../utilities/debug";
import type {
  AppCollectionManifest,
  AppFolderManifest,
  ManifestBase,
  ManifestCacheItem,
  ManifestItem,
  ManifestLocation,
} from "../../models/cache";
import type { SPFxExtensionAppManifest, SPFxExtensionAppRegistration } from "../../models/appModel";
import { getWebId } from "./contextService";
import { getManifestFromCache, setOrUpdateManifest } from "./coreIdbService";
import { ROOT_APPS_MANIFEST_LOCATION, APP_CATALOG, WELL_KNOWN_MANIFEST_LOCATION, APPCOLLECTION_MANIFEST_NAME, MANIFEST_NAME } from "../utilities/coreConstants";

interface AssetPromise {
  url: string;
  promise: Promise<any>;
}

const emptyManifest: SPFxExtensionAppManifest = { enabledApps: [], appRelativeEntryPointUrl: "", enabled: false, enabledOnAllHubSites: false }

function validateAppCollectionManifest(manifest: any) {
  if (!Array.isArray(manifest)) {
    throw `${SPFxExtensionCore} App manifest should be an array of strings`;
  }
  if (
    manifest.some((v) => {
      return typeof v !== "string";
    })
  ) {
    throw `${SPFxExtensionCore} App manifest should only contain strings`;
  }
}

function validateAppManifest(manifest: SPFxExtensionAppManifest) {
  if (Array.isArray(manifest) || typeof manifest !== "object") {
    throw `${SPFxExtensionCore} App manifest has to be an object.`;
  }

  if (!manifest.appRelativeEntryPointUrl) {
    console.error(SPFxExtensionCore, `Manifest does not have appRelativeEntryPointUrl property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have appRelativeEntryPointUrl property.`;

  }
  if (!manifest.enabledApps) {
    console.error(SPFxExtensionCore, `Manifest does not have enabledApps property.`, manifest);
    throw `${SPFxExtensionCore} Manifest does not have enabledApps property.`;
  }
}

function validateManifest(manifest: any, isAppCollection: boolean) {
  if (!manifest) {
    throw `${SPFxExtensionCore} Manifest supplied is undefined`;
  }
  isAppCollection
    ? validateAppCollectionManifest(manifest)
    : validateAppManifest(manifest);
}

//@param [cacheTime=3600000] use ```3600000``` to cache for one hour (3600 seconds)

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
async function fetchAndCacheTXT(
  url: string,
  siteUrl: string,
  type: ManifestLocation,
  isAppCollection: boolean,
  skipCache = false,
  cacheTimeMinutes = 60
): Promise<ManifestItem> {
  let appManifest = { ...emptyManifest };
  let appCollection: string[] = [];

  if (!skipCache && !isInDebug) {
    let cachedManifest = await getManifestFromCache(url, isAppCollection);
    if (cachedManifest) {
      return cachedManifest;
    }
  }

  try {
    console.debug(SPFxExtensionCore, `Fetching manifest from`, url);
    const mnfReq = await fetch(url);
    const result = await mnfReq.json();
    if (isAppCollection) {
      appCollection = result;
    } else {
      appManifest = result;
    }
  } catch (err) {
    console.warn(SPFxExtensionCore, `Unable to fetch manifest from`, url, err);
  }
  try {
    validateManifest(
      isAppCollection ? appCollection : appManifest,
      isAppCollection
    );
  } catch (err) {
    console.error(SPFxExtensionCore, `Error while parsing manifest from`, url, err);
    appManifest = { ...emptyManifest };
    appCollection = [];
  }
  const hash = await getContentDigest(
    JSON.stringify(isAppCollection ? appCollection : appManifest)
  );
  const baseResult = {
    url,
    type,
    hash,
    siteUrl,
  };

  const retResult: ManifestItem = isAppCollection
    ? { appCollection, isAppCollection: true, ...baseResult }
    : { appManifest, isAppCollection: false, ...baseResult };

  await setOrUpdateManifest(retResult, isInDebug ? 1 : cacheTimeMinutes);

  return retResult;
}

async function parseManifestAndImport(
  manifestToParse: SPFxExtensionAppManifest,
  cdnLoc: string
) {
  const returnPromiseArray: AssetPromise[] = [];
  const currentWebId = getWebId();

  const fullJSUrl = `${cdnLoc}${manifestToParse.appRelativeEntryPointUrl}?v=${new Date().getTime()}`;
  const url = new URL(fullJSUrl);
  console.debug(SPFxExtensionCore, `EntryPoint JS: `, fullJSUrl);
  const isAllowed = await isFileAllowedInCurrentWeb(url.toString().replace(url.search, ""));
  if (!isAllowed || !manifestToParse.enabled) {
    return returnPromiseArray;
  }
  const isScriptLoaded =
    window.__SPFxExtensions.LoadedAppAssets.includes(fullJSUrl);
  if (!isScriptLoaded) {
    window.__SPFxExtensions.LoadedAppAssets.push(fullJSUrl);
    returnPromiseArray.push({
      url: fullJSUrl,
      promise: new Promise(async (resolve, reject) => {
        try {
          const appRegistrations = await import(fullJSUrl);
          const defaultExport = appRegistrations.default;
          if (!Array.isArray(defaultExport)) {
            console.error(SPFxExtensionCore, `Default export of entry point should be an array of App definitions. TODO: add documentation url`, fullJSUrl);
            reject(`App definitions should be an array.`);
          }
          for (const appReg of defaultExport) {
            if (!appReg.id) {
              console.error(SPFxExtensionCore, `App definition does not have an id. Make sure that returned array is in proper format. TODO: add documentation url`, fullJSUrl, appReg);
              continue;
            }
            const appEnabled = manifestToParse.enabledApps.some((ea) => {
              const isSameWebId = ea.webId.toLowerCase() === currentWebId.toLowerCase();
              const allWebsEnabled = ea.webId === "*";
              const isEnabledAppId = ea.enabledAppIds.some((eai) => eai.toLowerCase() === appReg.id.toLowerCase());
              const allAppsEnabled = ea.enabledAppIds.some((eai) => eai === "*");
              return (isSameWebId && isEnabledAppId) ||
                (isSameWebId && allAppsEnabled) ||
                (allWebsEnabled && allAppsEnabled) ||
                (allWebsEnabled && isEnabledAppId);
            });
            if (!appEnabled) {
              console.info(SPFxExtensionCore, `App with id ${appReg.id} ${appReg.name} is not enabled for current web. Skipping...`);
              continue;
            }
            window.__SPFxExtensions.RegisterApp(appReg);
            if (!appReg.isWebPartApp) {
              window.__SPFxExtensions.LoadApp(appReg.id, {});
            }
            resolve(appRegistrations);
          }
        }
        catch (e) {
          console.error(SPFxExtensionCore, `Error while importing`, fullJSUrl, e);
          reject(`Unable to import manifest ${fullJSUrl}, only ESM modules are supported.`);
        }
      }),
    });
  }


  return returnPromiseArray;
}

export async function fetchAppsTXTFromAllLocations(
  siteUrl: string,
  webUrl: string,
  hubUrl: string,
  skipCache = false
): Promise<AppCollectionManifest[]> {
  // all apps.txt accross the context (root / site /web)
  const allAppManifests: Promise<ManifestItem>[] = [];
  const rootLocation = ROOT_APPS_MANIFEST_LOCATION.toLowerCase().startsWith("http") ? ROOT_APPS_MANIFEST_LOCATION : `${window.location.origin}${ROOT_APPS_MANIFEST_LOCATION}`;
  allAppManifests.push(
    fetchAndCacheTXT(
      rootLocation,
      APP_CATALOG,
      "root",
      true,
      skipCache
    )
  );

  const normalizedSiteUrl = siteUrl + WELL_KNOWN_MANIFEST_LOCATION;

  allAppManifests.push(
    fetchAndCacheTXT(
      `${normalizedSiteUrl}${APPCOLLECTION_MANIFEST_NAME}`,
      siteUrl,
      "site",
      true,
      skipCache
    )
  );

  if (hubUrl) {
    const normalizedHubUrl = hubUrl + WELL_KNOWN_MANIFEST_LOCATION;
    allAppManifests.push(
      fetchAndCacheTXT(
        `${normalizedHubUrl}${APPCOLLECTION_MANIFEST_NAME}`,
        hubUrl,
        "site",
        true,
        skipCache
      )
    );
  }

  const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  if (!siteIsWeb) {
    const normalizedWebUrl = webUrl + WELL_KNOWN_MANIFEST_LOCATION;
    allAppManifests.push(
      fetchAndCacheTXT(
        `${normalizedWebUrl}${APPCOLLECTION_MANIFEST_NAME}`,
        webUrl,
        "web",
        true,
        skipCache
      )
    );
  }
  const manifestResult = await Promise.all(allAppManifests);

  return manifestResult as AppCollectionManifest[];
}

/***
 * @param baseUrl should be:
 *
 * Root: ```/sites/appcatalog/CDN/SPFxExtensionApps/```
 *
 * Site: ```/sites/[SomeSite]/SPFxExtensionApps/```
 */
function GetAppManifestLocation(baseUrl: string, appKey: string) {
  const lsKey = `${DEBUG_KEYS.SPFXEXT}${appKey}`;
  const devSitePort = Number(localStorage.getItem(lsKey));
  const siteLocation = `${baseUrl}${appKey}/${MANIFEST_NAME}`;
  if (devSitePort > 0) {
    const debugLoc = `https://localhost:${devSitePort}/${MANIFEST_NAME}`;
    console.info(
      SPFxExtensionCore,
      `<${appKey}> App is in debug mode, loading from`,
      debugLoc
    );
    return debugLoc;
  }
  return siteLocation;
}

function loadManifestTXT(
  appCollectionManifests: AppCollectionManifest[],
  skipCache = false
) {
  if (appCollectionManifests.length === 0) return [];
  const manifestPromises: Promise<ManifestItem>[] = [];
  for (const appCollectionManifest of appCollectionManifests) {
    const baseUrl = appCollectionManifest.url.replace(
      APPCOLLECTION_MANIFEST_NAME,
      ""
    );
    for (const appFolderName of appCollectionManifest.appCollection) {
      const manifestLocation = GetAppManifestLocation(baseUrl, appFolderName);
      manifestPromises.push(
        fetchAndCacheTXT(
          manifestLocation,
          appCollectionManifest.siteUrl,
          appCollectionManifest.type,
          false,
          skipCache
        )
      );
    }
  }
  return manifestPromises;
}

export async function loadModernApps(
  siteUrl: string,
  webUrl: string,
  hubUrl: string
) {
  if (window.__SPFxExtensions.AppLoadInitialized) return;
  window.__SPFxExtensions.AppLoadInitialized = true;
  window.__SPFxExtensions.LoadedAppAssets = [];
  //LOAD apps.txt
  const coreCollection = await fetchAppsTXTFromAllLocations(
    siteUrl,
    webUrl,
    hubUrl
  );
  const allManifestTXTs = getManifestsFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises =
    allManifestTXTs;
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(
    allManifestTXTs
  );
  const resolvedManifestTXTs = allManifestTXTsPromises.filter(
    (p) => p.status === "fulfilled"
  ) as PromiseFulfilledResult<ManifestItem>[];

  const entryPointsFromManifestTXTs: Promise<AssetPromise[]>[] = [];
  const resolvedRootAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "root"
  );
  const resolvedSiteAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "site"
  );
  const resolvedWebAppsManifests = resolvedManifestTXTs.filter(
    (m) => m.value.type === "web"
  );

  //sort out so that root is first to go, that way root cannot be overriden by site and site cannot be overriden by web
  //TODO: check performance impact

  for (const rootManifestTXT of resolvedRootAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseResolvedManifestTXT(
        rootManifestTXT as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  //wait for root stuff to load
  const rootResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootResults));
  console.debug(SPFxExtensionCore, "Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseResolvedManifestTXT(
        siteManifests as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  const rootAndSiteResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteResults));
  console.debug(SPFxExtensionCore, "Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseResolvedManifestTXT(
        webManifests as PromiseFulfilledResult<AppFolderManifest>
      )
    );
  }
  const rootAndSiteAndWebResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteAndWebResults));
  console.debug(SPFxExtensionCore, "SiteWeb apps loaded.");

  const entryPointSettledResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  const fetchedEntryPoints = entryPointSettledResults.filter(
    (r) => r.status === "fulfilled"
  ) as PromiseFulfilledResult<AssetPromise[]>[];

  const assetPromises = fetchedEntryPoints.flatMap((a) => a.value);
  await Promise.allSettled(assetPromises.map((a) => a.promise));

  for (const asset of assetPromises) {
    asset.promise.catch((e) => {
      console.error(SPFxExtensionCore, `Could not load or parse manifest:`, asset.url, e);
    });
  }
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  console.info(SPFxExtensionCore, "SPFx Extensions Core Components Loaded.");
}

export function getManifestsFromAllLocations(
  coreCollection: AppCollectionManifest[],
  skipCache = false
) {
  const rootAppsCollectionManifest = coreCollection.filter(
    (app) => app.type === "root"
  );
  const rootAppPromises = loadManifestTXT(
    rootAppsCollectionManifest,
    skipCache
  );

  const siteCollectionAppsManifest = coreCollection.filter(
    (app) => app.type === "site"
  );
  const scAppPromises = loadManifestTXT(
    siteCollectionAppsManifest,
    skipCache
  );

  // const siteIsWeb = siteUrl.toLowerCase() === webUrl.toLowerCase();
  // let subsitePromises: Promise<ManifestItem>[] = [];
  // if (!siteIsWeb) {
  const webAppCollectionManifest = coreCollection.filter(
    (app) => app.type === "web"
  );
  const subsitePromises = loadManifestTXT(
    webAppCollectionManifest,
    skipCache
  );
  //}

  //foreach app do stuff
  const allWebpackManifestsTXT = [
    ...rootAppPromises,
    ...scAppPromises,
    ...subsitePromises,
  ];
  return allWebpackManifestsTXT;
}

function getModulePromises(
  manifestResults: PromiseSettledResult<AssetPromise[]>[]
) {
  const modulePromises: Promise<any>[] = [];
  for (const manifestResult of manifestResults) {
    if (manifestResult.status === "fulfilled") {
      for (const module of manifestResult.value) {
        modulePromises.push(module.promise);
      }
    }
  }
  return modulePromises;
}

function parseResolvedManifestTXT(
  manifestTXTResult: PromiseFulfilledResult<AppFolderManifest>
) {
  const appManifestTXTResultValue = manifestTXTResult.value;
  const appBaseUrl = appManifestTXTResultValue.url.replace(MANIFEST_NAME, "");
  console.debug(
    SPFxExtensionCore,
    "Parsing",
    appManifestTXTResultValue.type,
    "manifest:",
    appManifestTXTResultValue.appManifest
  );

  return parseManifestAndImport(
    appManifestTXTResultValue.appManifest,
    appBaseUrl
  );
}
