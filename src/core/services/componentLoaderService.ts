import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";
import type { SPFxExtensionAppRegistration } from "../../models/appModel";
import type { CacheableAppFolderManifest } from "../../models/cache";
import { CONFIGURATOR_APP_ID, MANIFEST_NAME } from "../../utilities/constants";
import { isAppInDebug } from "../../utilities/debug";
import { isFileAllowedToRun } from "./allowedAppsService";
import { unmountInstancesOnContextChange } from "./appServices";
import { getHubSiteId, getSiteId, getWebId } from "./contextService";
import {
  logGenericCoreDebug,
  logGenericCoreError,
  logGenericCoreInfo,
  logGenericCoreWarning,
} from "./loggingService";
import { fetchAppCollectionConfigFromAllLocations } from "./txtAppsService";
import { getManifestTXTFromAllLocations } from "./txtManifestService";

let isLoaded = false;
const loadedAssets: string[] = [];

export async function importEntryPointsAndExecute(fullJSUrl: string, originalEntry: string, manifest: SPFxExtensionFolderManifest) {

  // if non esm do additional checks here
  if (!manifest.isESM) {
    const appRegsBeforeEntryPoint = window.__SPFxExtensions.Apps.map(a => a.id);
    logGenericCoreWarning(
      `Non-ESM module detected. Make sure to call window.__SPFxExtensions.RegisterApp in code.`,
      fullJSUrl
    );
    const foundNonESMAppConfig = manifest.appDefinitionMap.find(a => a.appId === originalEntry);
    if (!foundNonESMAppConfig) {
      logGenericCoreError(`Could not find app configuration item for non-ESM app`, originalEntry);
      return [];
    }
    try {
      await import(fullJSUrl);
    }
    catch (e) {
      logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
      return [];
    }
    //if the apps were registered in non ESM the array will be different, this is how we know that the app was registered
    return window.__SPFxExtensions.Apps.filter(a => appRegsBeforeEntryPoint.indexOf(a.id) === -1);
  }
  else {
    try {
      const appRegistrations = await import(fullJSUrl);
      const defaultExport =
        appRegistrations.default as SPFxExtensionAppRegistration[];
      if (!defaultExport) {
        logGenericCoreError(`No default export found in ${fullJSUrl}, only ESM modules are supported.`);
        return [];
      }
      return executeESMRegistrations(defaultExport, manifest, fullJSUrl);;
    } catch (e) {
      logGenericCoreError(`Error while importing or executing`, fullJSUrl, e);
      return [];
    }
  }

}

async function parseManifestAndImportEntryPoints(
  manifestToParse: CacheableAppFolderManifest
) {
  const returnPromiseArray: Promise<SPFxExtensionAppRegistration[]>[] = [];
  const cdnLoc = manifestToParse.url.replace(MANIFEST_NAME, "");

  logGenericCoreDebug(
    "Parsing",
    manifestToParse.type,
    "manifest:",
    manifestToParse.manifest
  );

  for (const entryUrl of manifestToParse.manifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "./");
    const fullJSUrl = `${cdnLoc}${ep}`.toLowerCase();

    logGenericCoreDebug(`EntryPoint JS: `, fullJSUrl);
    const jsUrl = new URL(fullJSUrl);
    if (
      manifestToParse.manifest.cacheString &&
      manifestToParse.manifest.enableCaching
    ) {
      const cacheString = isAppInDebug(manifestToParse.name)
        ? `${new Date().getTime()}`
        : manifestToParse.manifest.cacheString;
      jsUrl.searchParams.set("v", `${cacheString}`);
    }
    // if()
    const isAllowed = await isFileAllowedToRun(jsUrl, manifestToParse.name);
    if (!isAllowed) {
      continue;
    }
    const plainUrl = `${jsUrl.origin}${jsUrl.pathname}`;
    const urlWithCache = `${jsUrl}`;
    const isScriptLoaded = loadedAssets.includes(plainUrl);
    if (isScriptLoaded) {
      logGenericCoreInfo(`EntryPoint already loaded:`, urlWithCache);
      continue;
    }
    loadedAssets.push(plainUrl);
    returnPromiseArray.push(importEntryPointsAndExecute(urlWithCache, entryUrl, manifestToParse.manifest));
  }

  return returnPromiseArray;
}
export async function loadModernApps(
  siteUrl: string,
  webUrl: string,
  hubUrl: string,
  contextId: string,
  contextChange = false
) {
  if (contextChange) {
    handleContextChange(contextId);
  }
  if (isLoaded) return;
  isLoaded = true;
  // window.__SPFxExtensions.LoadedAppAssets = [];
  //LOAD collectionConfig.txt
  const coreCollection = await fetchAppCollectionConfigFromAllLocations(
    siteUrl,
    webUrl,
    hubUrl
  );
  const allManifestTXTs = getManifestTXTFromAllLocations(coreCollection);

  window.__SPFxExtensions.Utils.appManifestPromises = allManifestTXTs;
  window.__SPFxExtensions.Utils.spAppInitializationPromiseResolver();

  const allManifestTXTsPromises = await Promise.allSettled(allManifestTXTs);
  const resolvedManifestTXTs = allManifestTXTsPromises.filter(
    (p) => p.status === "fulfilled"
  );

  const successfullAppRegistrations: Promise<SPFxExtensionAppRegistration[]>[] = [];
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
    const rootEntries = await parseManifestAndImportEntryPoints(rootManifestTXT.value);
    successfullAppRegistrations.push(...rootEntries);
  }
  logGenericCoreDebug("Root apps loaded.");

  //wait for site stuff to load
  for (const siteManifests of resolvedSiteAppsManifests) {
    const siteEntries = await parseManifestAndImportEntryPoints(siteManifests.value)
    successfullAppRegistrations.push(...siteEntries);
  }
  logGenericCoreDebug("Site apps loaded.");

  //wait for web stuff to load
  for (const webManifests of resolvedWebAppsManifests) {
    const webEntries = await parseManifestAndImportEntryPoints(webManifests.value);
    successfullAppRegistrations.push(...webEntries);
  }
  logGenericCoreDebug("SiteWeb apps loaded.");
  const successfullyRegistered = (await Promise.allSettled(successfullAppRegistrations)).filter(
    (r) => r.status === "fulfilled").flatMap((r) => r.value);;

  //unregister any remaining app definitions that are not applicable to this context
  await unregisterNonApplicable(successfullyRegistered);
  window.__SPFxExtensions.AllAppAssetsLoadedResolver();
  logGenericCoreInfo("SPFx Extensions Core Components Loaded.");
}

function handleContextChange(contextId: string) {
  isLoaded = false;
  loadedAssets.splice(0, loadedAssets.length);
  unmountInstancesOnContextChange(contextId);
  const { promise: assetPromise, resolve: assetPromiseResolver } =
    Promise.withResolvers<void>();
  window.__SPFxExtensions.AllAppAssetsLoadedPromise = assetPromise;
  window.__SPFxExtensions.AllAppAssetsLoadedResolver = assetPromiseResolver;
}

async function unregisterNonApplicable(
  allExports: SPFxExtensionAppRegistration[]
) {
  for (const alreadyRegisteredApp of window.__SPFxExtensions.Apps) {
    const foundApp = allExports.find((a) => a.id === alreadyRegisteredApp.id);
    if (!foundApp && alreadyRegisteredApp.id !== CONFIGURATOR_APP_ID) {
      //unregister app as it does not belong to this context
      const unregistered = await window.__SPFxExtensions.UnregisterApp(
        alreadyRegisteredApp.id
      );
      if (unregistered) {
        logGenericCoreWarning(
          `Unregistered app as it does not belong in this context`,
          alreadyRegisteredApp.id,
          alreadyRegisteredApp.name
        );
      }
    }
  }
}

function executeESMRegistrations(
  registrations: SPFxExtensionAppRegistration[],
  manifestToParse: SPFxExtensionFolderManifest,
  fullJSUrl: string
) {
  // const isHub = getIsHubSite();
  const currentWebId = getWebId().toLowerCase();
  const currentSiteId = getSiteId().toLowerCase();
  const currentHubId = getHubSiteId().toLowerCase();

  if (!Array.isArray(registrations)) {
    logGenericCoreError(
      `Default export of entry point should be an array of App definitions. TODO: add documentation url`,
      fullJSUrl
    );
  }
  const successfullyRegistered: SPFxExtensionAppRegistration[] = [];
  for (const appReg of registrations) {
    if (!appReg.id) {
      logGenericCoreError(
        `App definition does not have an id. Make sure that returned array is in proper format. TODO: add documentation url`,
        fullJSUrl,
        appReg
      );
      continue;
    }
    const foundMapItem = manifestToParse.appDefinitionMap.find(
      (a) => a.appId.toLowerCase() === appReg.id.toLowerCase()
    );
    const notEnabledMSG = `App with id ${appReg.id} ${appReg.name} is not enabled for current web. Skipping...`;
    if (!foundMapItem) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    const isEnabledEverywhere = foundMapItem.config.enabledEverywhere;
    const appEnabled = isEnabledEverywhere ?
      foundMapItem.config.excludedIds.indexOf(currentWebId) === -1 &&
      foundMapItem.config.excludedIds.indexOf(currentSiteId) === -1 &&
      foundMapItem.config.excludedHubIds.indexOf(currentHubId) === -1 : true;

    if (!appEnabled) {
      logGenericCoreInfo(notEnabledMSG);
      continue;
    }
    window.__SPFxExtensions.RegisterApp(appReg);
    successfullyRegistered.push(appReg);
    if (!appReg.isWebPartApp && appReg.autoExecute) {
      window.__SPFxExtensions.InstantiateApp(appReg.id, {});
    }
  }
  return successfullyRegistered;
}