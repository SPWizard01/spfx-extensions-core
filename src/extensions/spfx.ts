import { DEBUG_KEYS } from "../utilities/debug";

/**
 * Points to core location, the holy grail that makes everything working.
 * Setting `localStorage["SPFXEXTDEV_CORE"]` to a number i.e. `33343` makes it load
 * from `https://localhost:33343/`.
 *
 * Default URL: ```/sites/AppCatalog/CDN/SPFxExtensionAppsCore/core.js```
 */
export function getRootCoreLocation() {
  const devPort = Number(localStorage.getItem(DEBUG_KEYS.SPFXEXT_CORE));
  const devCDN = `https://localhost:${devPort}/core.js`;
  const cdnLoc = devPort > 0
    ? devCDN
    : window.__SPFxExtensions.__CoreConfig.find((c) => c.Title === "CoreUrl")?.Data;
  if (!cdnLoc) {
    const msg = "Core URL is not set, please set it in __SPFxExtensions.__CoreConfig.CoreUrl";
    console.error(msg);
    throw new Error(msg);
  }
  return cdnLoc;
}

/**
 * Should only be used inside of SPFx or content script in classic pages on SP
 * @returns Singleton promise that resolves once the core is loaded
 */
export function loadCoreForSPFxOrClassicWrapper() {
  if (window.__SPFxExtensions.__CorePromise) {
    return window.__SPFxExtensions.__CorePromise;
  }
  const ROOT_CORE_LOCATION = getRootCoreLocation();
  const bustCache = ROOT_CORE_LOCATION.indexOf("localhost") > -1;
  const cacheVersion = bustCache
    ? `${Date.now()}`
    : `${Math.floor(Date.now() / 3600000)}`;
  const coreUrl = `${ROOT_CORE_LOCATION}?v=${cacheVersion}`;
  window.__SPFxExtensions.__CorePromise = new Promise((resolve) => {
    window.__SPFxExtensions.__CorePromiseResolver = resolve;
    const coreScript = document.createElement("script");
    coreScript.src = coreUrl;
    coreScript.type = "module";
    coreScript.addEventListener("error", (err) => {
      console.error(
        "Catastrophic failure, cannot load SPFxExtensions Core from",
        coreUrl,
        err
      );
    });
    document.head.appendChild(coreScript);
  });

  return window.__SPFxExtensions.__CorePromise;
}
