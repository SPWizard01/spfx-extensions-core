

const SPFXPREFIX = "[SPFxExtensions/Core]";

interface UrlReturn {
  default: string;
}

interface SuggestedUrls {
  coreUrl: UrlReturn;
  configuratorUrl: UrlReturn;
}

type SuggestedUrlResolver = () => Promise<SuggestedUrls>;

/**
 * Points to core location, the holy grail that makes everything working.
 * Setting `localStorage["SPFXEXT"]` to a number i.e. `33343` makes it load
 * from `https://localhost:33343/`.
 *
 * Default URL: ```/sites/appcatalog/CDN/SPFxExtensionAppsCore/core.js```
 */
async function getRootCoreLocation(suggestedUrlResolver: SuggestedUrlResolver) {
  const devPort = Number(localStorage.getItem("SPFXEXT"));
  const coreUrls = {
    core: "",
    configuratorUrl: ""
  }
  if (devPort > 0) {
    const t = Date.now();
    coreUrls.core = `https://localhost:${devPort}/__spfxCore.js?v=${t}`;
    coreUrls.configuratorUrl = `https://localhost:${devPort}/__spfxCoreConfigurator.js?v=${t}`;
    return coreUrls;
  }

  const { coreUrl, configuratorUrl } = await suggestedUrlResolver();

  if (!coreUrl.default) {
    const msg = "Unable to resolve SPFx Core location";
    throw new Error(`${SPFXPREFIX} ${msg}`);
  }
  if (!configuratorUrl.default) {
    const msg = "Unable to resolve SPFx Core Configurator location";
    throw new Error(`${SPFXPREFIX} ${msg}`);
  }
  coreUrls.core = coreUrl.default;
  coreUrls.configuratorUrl = configuratorUrl.default;
  console.info(SPFXPREFIX, "Core location resolved to", coreUrls);
  return coreUrls;
}

/**
 * Should only be used inside of SPFx or content script in classic pages on SP
 * @returns Singleton promise that resolves once the core is loaded
 */
export async function loadCoreForSPFxOrClassic(suggestedUrlResolver: SuggestedUrlResolver) {
  if (window.__SPFxExtensions.__CorePromise) {
    return window.__SPFxExtensions.__CorePromise;
  }
  const { promise: corePromise, resolve: coreResolver } = Promise.withResolvers<void>();
  window.__SPFxExtensions.__CorePromise = corePromise;
  window.__SPFxExtensions.__CorePromiseResolver = coreResolver;

  const coreAddress = await getRootCoreLocation(suggestedUrlResolver);
  window.__SPFxExtensions.__ConfiguratorUrl = coreAddress.configuratorUrl;

  const coreScript = document.createElement("script");
  coreScript.src = coreAddress.core;
  coreScript.type = "module";
  coreScript.addEventListener("error", (err) => {
    console.error(
      SPFXPREFIX,
      "Catastrophic failure, cannot load SPFxExtensions Core from",
      coreAddress,
      err
    );
  });
  document.head.appendChild(coreScript);
  return window.__SPFxExtensions.__CorePromise;
}
