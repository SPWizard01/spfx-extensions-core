import type { ConfigurationListBaseData } from "../../models/configurationList";
import { CONFIGURATOR_PAGE_URL, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { SPFX_EXTENSIONS_SITE_URL } from "./appCatalogService";
import { getConfigurationListData } from "./configurationListService";
import { ensureSPFxWeb } from "./configurationWebService";
import { ensureConfiguratorPage } from "./pageService";
import { ensureAppWhiteList } from "./whiteListService";

let configurationInitializationPromise: Promise<void> | undefined;
export async function initializeCoreConfiguration() {
  if (configurationInitializationPromise) {
    return configurationInitializationPromise;
  }
  configurationInitializationPromise = initializeCoreConfigurationInternal();
  return configurationInitializationPromise;
}
async function initializeCoreConfigurationInternal() {
  await ensureSPFxWeb();
  await ensureAppWhiteList();
  await ensureConfiguratorPage();
  window.__SPFxExtensions.Utils.ConfiguratorPageUrl = `${SPFX_EXTENSIONS_SITE_URL}/${CONFIGURATOR_PAGE_URL}`;
}

export async function getCoreConfig(fresh = false): Promise<ConfigurationListBaseData[]> {
  await initializeCoreConfiguration();
  return getConfigurationListData(fresh);
}

/**
 * Reads a single global setting's raw value by its `Title`, or `undefined` when absent.
 */
export async function getCoreConfigValue(title: ConfigurationListBaseData["Title"], fresh = false) {
  const coreConfig = await getCoreConfig(fresh);
  return coreConfig.find((c) => c.Title === title)?.Data;
}

/**
 * Reads a global setting as a boolean (`"true"` => `true`), falling back to
 * `defaultValue` when the setting is missing.
 */
export async function getBooleanCoreConfig(
  title: ConfigurationListBaseData["Title"],
  defaultValue = false,
  fresh = false
): Promise<boolean> {
  const value = await getCoreConfigValue(title, fresh);
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value === "true";
}

/**
 * Points to root sharepoint location into app catalog
 * OnPrem/SPO: ```{APP_CATALOG_URL}/SPFxExtensionsData/SPFxExtensions/```
 */
export async function getRootCDNLocation() {
  // `RootCDNLocation` is always present because reads merge in defaults (its default is
  // `SPFX_EXTENSIONS_SITE_URL`).
  const ROOT_CDN_LOCATION = await getCoreConfigValue("RootCDNLocation");

  const ROOT_APPS_LOCATION = `${ROOT_CDN_LOCATION}${WELL_KNOWN_MANIFEST_LOCATION}`;
  return ROOT_APPS_LOCATION;
}

/**
 * When enabled, `manifest.json` / `collectionconfig.json` are fetched through the
 * SharePoint Online public CDN while scanning. Defaults to `false`.
 */
export function getUsePublicCDNForManifests() {
  return getBooleanCoreConfig("UsePublicCDNForManifests", false);
}
