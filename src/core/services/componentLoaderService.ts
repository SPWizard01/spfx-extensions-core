import type { SPFxExtensionAppMap } from "../../models/appCollectionManifest";
import type { SPFxExtensionAppRegistration } from "../../models/appModel";
import type { AppFolderManifest } from "../../models/cache";
import { MANIFEST_NAME, } from "../../utilities/constants";
import { isAppInDebug, } from "../../utilities/debug";
import { isFileAllowedToRun } from "./allowedAppsService";
import { getWebId } from "./contextService";
import { logGenericCoreDebug, logGenericCoreError, logGenericCoreInfo, logGenericCoreWarning } from "./loggingService";
import { fetchAppsTXTFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";

interface AssetPromise {
  url: string;
  promise: Promise<SPFxExtensionAppRegistration[]>;
  manifest: AppFolderManifest;
}

export async function importEntryPoint(fullJSUrl: string, isESM: boolean) {

  try {
    const appRegistrations = await import(fullJSUrl);
    if (!isESM) {
      logGenericCoreWarning(`Non ESM module detected. Make sure to call window.__SPFxExtensions.RegisterApp in code.`, fullJSUrl);
      return [];
    }
    const defaultExport = appRegistrations.default as SPFxExtensionAppRegistration[];
    if (!defaultExport) {
      throw `No default export found in ${fullJSUrl}, only ESM modules are supported.`;
    }
    return defaultExport;
  }
  catch (e) {
    logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
    throw e
  }
}

async function parseManifestAndImportEntryPoints(
  manifestToParse: AppFolderManifest,
) {
  const returnPromiseArray: AssetPromise[] = [];
  const cdnLoc = manifestToParse.url.replace(MANIFEST_NAME, "");

  logGenericCoreDebug(
    "Parsing",
    manifestToParse.type,
    "manifest:",
    manifestToParse.appManifest
  );

  for (const entryUrl of manifestToParse.appManifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "./");
    const fullJSUrl = `${cdnLoc}${ep}`.toLowerCase();


    logGenericCoreDebug(`EntryPoint JS: `, fullJSUrl);
    const jsUrl = new URL(fullJSUrl);
    if (manifestToParse.appManifest.cacheString && manifestToParse.appManifest.enableCaching) {
      const cacheString = isAppInDebug(manifestToParse.name) ? `${(new Date()).getTime()}` : manifestToParse.appManifest.cacheString
      jsUrl.searchParams.set("v", `${cacheString}`);
    }
    // if()
    const isAllowed = await isFileAllowedToRun(jsUrl);
    if (!isAllowed) {
      continue;
    }
    const plainUrl = `${jsUrl.origin}${jsUrl.pathname}`;
    const urlWithCache = `${jsUrl}`;
    const isScriptLoaded =
      window.__SPFxExtensions.LoadedAppAssets.includes(plainUrl);
    if (!isScriptLoaded) {
      window.__SPFxExtensions.LoadedAppAssets.push(plainUrl);
      returnPromiseArray.push({
        url: urlWithCache,
        promise: importEntryPoint(urlWithCache, manifestToParse.appManifest.isESM),
        manifest: manifestToParse
      });
    } else {
      logGenericCoreInfo(`EntryPoint already loaded:`, urlWithCache);
    }

  }


  return returnPromiseArray;
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
  const allManifestTXTs = getManifestTXTFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises =
    allManifestTXTs
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(
    allManifestTXTs
  );
  const resolvedManifestTXTs = allManifestTXTsPromises.filter(
    (p) => p.status === "fulfilled"
  );

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
      parseManifestAndImportEntryPoints(
        rootManifestTXT.value
      )
    );
  }
  //wait for root stuff to load
  const rootResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootResults));
  logGenericCoreDebug("Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(
        siteManifests.value
      )
    );
  }
  const rootAndSiteResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteResults));
  logGenericCoreDebug("Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    entryPointsFromManifestTXTs.push(
      parseManifestAndImportEntryPoints(
        webManifests.value
      )
    );
  }
  const rootAndSiteAndWebResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );
  await Promise.allSettled(getModulePromises(rootAndSiteAndWebResults));
  logGenericCoreDebug("SiteWeb apps loaded.");

  const entryPointSettledResults = await Promise.allSettled(
    entryPointsFromManifestTXTs
  );

  //there will be no rejected results as this returns always an array of promises
  const fetchedEntryPoints = entryPointSettledResults.filter(
    (r) => r.status === "fulfilled"
  )

  const assetPromises = fetchedEntryPoints.flatMap((a) => a.value);
  await Promise.allSettled(assetPromises.map((a) => a.promise));

  for (const asset of assetPromises) {
    try {
      const exports = await asset.promise;
      if (!asset.manifest.appManifest.isESM) {
        continue;
      }
      await executeRegistration(exports, asset.manifest, asset.url);
    }
    catch (e) {
      logGenericCoreError(`Could not load or parse manifest.`, e);
    }
  }
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  logGenericCoreInfo("SPFx Extensions Core Components Loaded.");
}

async function executeRegistration(registrations: SPFxExtensionAppRegistration[], manifestToParse: AppFolderManifest, fullJSUrl: string) {
  // const isHub = getIsHubSite();
  const currentWebId = getWebId();

  if (!Array.isArray(registrations)) {
    logGenericCoreError(`Default export of entry point should be an array of App definitions. TODO: add documentation url`, fullJSUrl);
  }
  for (const appReg of registrations) {
    if (!appReg.id) {
      logGenericCoreError(`App definition does not have an id. Make sure that returned array is in proper format. TODO: add documentation url`, fullJSUrl, appReg);
      continue;
    }
    const foundMapItem = manifestToParse.appManifest.appDefinitionMap.find((a) => a.appId.toLowerCase() === appReg.id.toLowerCase());
    const foundAllItem = manifestToParse.appManifest.appDefinitionMap.find((a) => a.appId === "*");
    const notEnabledMSG = `App with id ${appReg.id} ${appReg.name} is not enabled for current web. Skipping...`;
    const relatedApps: SPFxExtensionAppMap[] = [];
    if (foundMapItem) {
      relatedApps.push(foundMapItem);
    }
    if (foundAllItem) {
      relatedApps.push(foundAllItem);
    }
    if (relatedApps.length === 0) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }

    const appEnabled = relatedApps.some((ea) => {
      //any of the related apps has matching web id
      const isSameWebId = ea.config.webIds.some(wid => wid.toLowerCase() === currentWebId.toLowerCase())
      //any of the related apps has wildcard web id
      const allWebsEnabled = ea.config.enabledOnChildren || ea.config.webIds.some(wid => wid === "*");
      return isSameWebId || allWebsEnabled;
    }) //|| isHub || (manifestToParse.isHubFetch && manifestToParse.appManifest.enabledOnAllHubSites);

    if (!appEnabled) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    window.__SPFxExtensions.RegisterApp(appReg);
    if (!appReg.isWebPartApp) {
      window.__SPFxExtensions.LoadApp(appReg.id, {});
    }
  }
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

