import type { SPFxExtensionUtilsPlaceHolderProvider } from "../models/appUtils";
import type { CompatibleEnvironmentType } from "../models/environment";
import {
  CONFIGURATOR_JS_NAME,
  CORE_JS_NAME,
  DEBUG_KEY_CORE,
  LOCAL_HOST,
  SPFXPLOADERREFIX,
} from "../utilities/runtimeConstants";

interface SuggestedUrls {
  coreUrl: string;
  configuratorUrl: string;
}

type SuggestedUrlResolver = () => Promise<SuggestedUrls>;

/**
 * Points to core location, the holy grail that makes everything working.
 *
 * Setting `window.localStorage["SPFXEXT"]` to a number i.e. `33343` makes it load
 * from `https://localhost:33343/`.
 */
async function getRootCoreLocation(suggestedUrlResolver: SuggestedUrlResolver) {
  const lsValue = window.localStorage.getItem(DEBUG_KEY_CORE) ?? "";
  const lsValueIsNumber = /^\d+$/.test(lsValue ?? "");
  const lsValueIsString = lsValue.trim() !== "";
  const coreUrls = {
    core: "",
    configuratorUrl: "",
  };
  const t = Date.now();
  if (lsValueIsNumber) {
    coreUrls.core = `${LOCAL_HOST}:${lsValue}/${CORE_JS_NAME}?v=${t}`;
    coreUrls.configuratorUrl = `${LOCAL_HOST}:${lsValue}/${CONFIGURATOR_JS_NAME}?v=${t}`;
    return coreUrls;
  }
  if (lsValueIsString) {
    coreUrls.core = `${lsValue}/${CORE_JS_NAME}?v=${t}`;
    coreUrls.configuratorUrl = `${lsValue}/${CONFIGURATOR_JS_NAME}?v=${t}`;
    return coreUrls;
  }

  const { coreUrl, configuratorUrl } = await suggestedUrlResolver();

  if (!coreUrl) {
    throw new Error(`${SPFXPLOADERREFIX} Unable to resolve SPFx Core location`);
  }
  if (!configuratorUrl) {
    throw new Error(`${SPFXPLOADERREFIX} Unable to resolve SPFx Core Configurator location`);
  }
  coreUrls.core = coreUrl;
  coreUrls.configuratorUrl = configuratorUrl;
  return coreUrls;
}

function prepareEnv(environmentType: CompatibleEnvironmentType, initializedThroughSPFX: boolean) {
  //assumes that window.__SPFxExtensions prepared by SPFx or Classic loader
  if (!window.__SPFxExtensions.__CorePromise) {
    const { promise: corePromise, resolve: coreResolver } = Promise.withResolvers<void>();
    window.__SPFxExtensions.__CorePromise = corePromise;
    window.__SPFxExtensions.__CorePromiseResolver = coreResolver;
  }

  if (!window.__SPFxExtensions.Utils) {
    const { promise: placeHolderProviderPromise, resolve: placeHolderResolver } =
      Promise.withResolvers<SPFxExtensionUtilsPlaceHolderProvider>();
    const { promise: spAppInitializationPromise, resolve: spAppInitializationPromiseResolver } =
      Promise.withResolvers<void>();

    window.__SPFxExtensions.Utils = {
      environmentType,
      initializedThroughSPFX,
      placeHolderProviderPromise,
      placeHolderResolver,
      appManifestPromises: [],
      spAppInitializationPromise,
      spAppInitializationPromiseResolver,
      fluentIconsInitialized: false,
      ConfiguratorPageUrl:
        "/sites/appcatalog/SPFxExtensionsData/SitePages/SPFxExtensionsConfigurator.aspx",
    };
  }
}

/**
 * Should only be used inside of SPFx or Classic Wrapper
 * @returns Singleton promise that resolves once the core is loaded
 */
export async function loadCoreForSPFxOrClassic(
  suggestedUrlResolver: SuggestedUrlResolver,
  envType: CompatibleEnvironmentType,
  initializedThroughSPFX: boolean
) {
  //assumes that window.__SPFxExtensions prepared by SPFx or Classic wrapper
  if (window.__SPFxExtensions.__CorePromise) {
    return window.__SPFxExtensions.__CorePromise;
  }

  prepareEnv(envType, initializedThroughSPFX);

  const locations = await getRootCoreLocation(suggestedUrlResolver);
  window.__SPFxExtensions.__ConfiguratorUrl = locations.configuratorUrl;
  console.info(SPFXPLOADERREFIX, "Loading SPFxExtensions Core from", locations);
  const coreScript = document.createElement("script");
  coreScript.src = locations.core;
  coreScript.type = "module";
  coreScript.addEventListener("error", (err) => {
    console.error(
      SPFXPLOADERREFIX,
      "Catastrophic failure, cannot load SPFxExtensions Core from",
      locations,
      err
    );
  });
  document.head.appendChild(coreScript);
  return window.__SPFxExtensions.__CorePromise;
}
