/**
 * CURRENTLY NOT USED, NOT TESTED
 */
import { logGenericCoreDebug, logGenericCoreError } from "../core/services/loggingService";
import type { SPFxExtensionModuleLoadResult } from "../models/importLoader";
import { DEBUG_KEYS } from "../utilities/debug";
import { debuggingEnabled } from "./debugService";

const IMPORT_CACHE_KEY = DEBUG_KEYS.SPFXEXT + "IMPORT_CACHE";

interface ImportCacheItem {
  id: string;
  url: string;
  cacheKey: string;
  cacheTime: number;
  cacheFor: number;
}

if (!window.__SPFxExtensions.ImportCallbacks) {
  window.__SPFxExtensions.ImportCallbacks = [];
}

function setImportCache(items: ImportCacheItem[]) {
  localStorage.setItem(IMPORT_CACHE_KEY, JSON.stringify(items));
}

function ensureImportCache() {
  if (!localStorage.getItem(IMPORT_CACHE_KEY)) {
    setImportCache([]);
  }
}

function getImportCache(): ImportCacheItem[] {
  ensureImportCache();
  let parsedItems: ImportCacheItem[] = [];
  if (debuggingEnabled()) {
    return parsedItems;
  }
  if (localStorage)
    try {
      parsedItems = JSON.parse(localStorage.getItem(IMPORT_CACHE_KEY)!);
    } catch {
      logGenericCoreError(
        `Unable to parse import cache, localStorage[${IMPORT_CACHE_KEY}] will be reset.`
      );
      setImportCache([]);
    }
  return parsedItems;
}

function getOrAddImportCacheItem(
  url: string,
  withResolve = false
): ImportCacheItem {
  evictCache();
  let itemUrl = url.toLowerCase();
  if (withResolve) {
    itemUrl = import.meta.resolve(itemUrl);
  }
  const foundItem = getImportCache().find(
    (x) => x.url.toLowerCase() === itemUrl
  );
  if (foundItem) {
    return foundItem;
  }
  return addImportCacheItem(url, withResolve);
}

function setImportCacheItem(item: ImportCacheItem) {
  const items = getImportCache();
  const existing = items.findIndex((x) => x.id === item.id);
  if (existing >= 0) {
    items.splice(existing, 1);
  }

  items.push(item);
  setImportCache(items);
}

function removeImportCacheItem(id: string) {
  const items = getImportCache();
  const existing = items.findIndex(
    (x) => x.id.toLowerCase() === id.toLowerCase()
  );
  if (existing > -1) {
    items.splice(existing, 1);
  }
  setImportCache(items);
}

function evictCache() {
  if (debuggingEnabled()) {
    setImportCache([]);
  }
  const now = Date.now();
  const toEvict = getImportCache().filter(
    (x) => x.cacheTime + x.cacheFor < now
  );
  logGenericCoreDebug("Following items will be evicted from import cache", toEvict);
  const toRetain = getImportCache().filter(
    (x) => x.cacheTime + x.cacheFor > now
  );
  setImportCache(toRetain);
}

function addImportCacheItem(
  url: string,
  withResolve: boolean,
  cacheFor = 3600000,
  cacheKey = `${Date.now()}`
) {
  let resolvedUrl = url.toLowerCase();
  if (withResolve) {
    resolvedUrl = import.meta.resolve(resolvedUrl);
  }
  const cacheItem: ImportCacheItem = {
    id: window.crypto.randomUUID(),
    url: resolvedUrl,
    cacheKey,
    cacheTime: Date.now(),
    cacheFor,
  };
  if (debuggingEnabled()) {
    return cacheItem;
  }
  evictCache();
  setImportCacheItem(cacheItem);
  return cacheItem;
}

function getModuleImportAsContent(url: string, moduleCallbackKey: string) {
  const importFunc = `async function importFunc() {
    let moduleUrl = "[URL_REPLACE]";
    const callBackKey = "[CALLBACK_REPLACE]";
    const module = await import(moduleUrl);
    if (callBackKey) {
      const cb = window.__SPFxExtensions.ImportCallbacks.find(
        (x) => x.key === callBackKey
      );
      if (cb) {
        cb.modulePromiseResolver({ isModuleAvailable: true, module });
        removeCallback(callBackKey);
      }
    }
  }`;
  const importFuncStr = importFunc
    .replace("[URL_REPLACE]", url)
    .replace("[CALLBACK_REPLACE]", moduleCallbackKey ?? "");

  return `;!(${importFuncStr})();`;
}

function removeCallback(callbackKey: string) {
  const idx = window.__SPFxExtensions.ImportCallbacks.findIndex(
    (x) => x.key === callbackKey
  );
  if (idx >= 0) {
    window.__SPFxExtensions.ImportCallbacks.splice(idx, 1);
  }
}

/**
 * When importing module throught script tag via text content, the executing path ("context") is bound to the page the browser is in.
 * If you are on https://contoso.sharepoint.com/sites/site1 and you(or some other javascript) import module from https://contoso.sharepoint.com/sites/site2,
 * the module will be executed in the context of `https://contoso.sharepoint.com/sites/site1`.
 *
 * If however you import module via script tag with src attribute, the module will be executed in the context of module location
 * in this case on `https://contoso.sharepoint.com/sites/site2`.
 *
 * ideally this should only be used to point to app entry points, and let app handle the rest.
 * @param url url of the module to import
 * @param withResolve if set to true, the url will be resolved via import.meta.resolve, will give an error if the caller is not in module context
 * @param keepCurrentContext if set to true, the module will be imported via script tag with text content, otherwise it will be imported via script tag with src attribute
 */
export async function importESModuleViaScriptTag<T>(
  url: string,
  withResolve: boolean,
  keepCurrentContext: boolean
): Promise<SPFxExtensionModuleLoadResult> {
  const cacheItem = getOrAddImportCacheItem(url, withResolve);
  const cachedUrl = `${cacheItem.url}?${cacheItem.cacheKey}`;
  const importKey = window.crypto.randomUUID();
  let modulePromiseResolver = function (
    module: SPFxExtensionModuleLoadResult
  ) {};
  const modulePromise = new Promise<SPFxExtensionModuleLoadResult>(
    (resolve) => {
      modulePromiseResolver = resolve;
    }
  );

  window.__SPFxExtensions.ImportCallbacks.push({
    key: importKey,
    modulePromise,
    modulePromiseResolver,
  });

  const script = document.createElement("script");
  script.type = "module";
  if (keepCurrentContext) {
    logGenericCoreDebug("Requesting via script content import: " + cachedUrl);
    script.textContent = getModuleImportAsContent(cachedUrl, importKey);
  } else {
    logGenericCoreDebug("Requesting via script src import: " + cachedUrl);
    script.src = cachedUrl;
    script.addEventListener("load", (d) => {
      const cb = window.__SPFxExtensions.ImportCallbacks.find(
        (x) => x.key === importKey
      );
      if (cb) {
        cb.modulePromiseResolver({
          module: undefined,
          isModuleAvailable: false,
        });
        removeCallback(importKey);
      }
    });
  }
  script.addEventListener("error", () => {
    logGenericCoreError(`Unable to import via script from ${cachedUrl}.`);
    removeImportCacheItem(cacheItem.id);
    removeCallback(importKey);
  });
  document.body.appendChild(script);
  return modulePromise;
}

/**
 * Assumes you are in module context, this will error out if you try to use it outside of module context.
 * @param url absolute or relative url of the module to import
 * @returns
 */
export async function importESModule(
  url: string,
  withResolve: boolean
): Promise<SPFxExtensionModuleLoadResult> {
  const cacheItem = getOrAddImportCacheItem(url, withResolve);
  const cachedUrl = `${cacheItem.url}?${cacheItem.cacheKey}`;
  logGenericCoreDebug("Requesting ES Module via import: " + cachedUrl);
  try {
    const module = await import(/* webpackIgnore: true */ cachedUrl);
    return {
      isModuleAvailable: true,
      module,
    };
  } catch (err) {
    logGenericCoreError(`Unable to import ES Module from ${url}. Error: `, err);
    removeImportCacheItem(cacheItem.id);
    return {
      isModuleAvailable: false,
      module: undefined,
    };
  }
}
