import type { ConfigurationListBaseData } from "../../models/configurationList";
import { CONFIGURATOR_PAGE_URL, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { SPFX_EXTENSIONS_SITE_URL } from "./appCatalogService";
import { getConfigurationListData, provisionInstall } from "./configurationListService";
import { logGenericCoreInfo } from "./loggingService";

let coreConfigurationPromise: Promise<void> | undefined;
export async function ensureCoreConfiguration() {
  if (coreConfigurationPromise) {
    return coreConfigurationPromise;
  }
  coreConfigurationPromise = ensureCoreConfigurationInternal();
  return coreConfigurationPromise;
}
async function ensureCoreConfigurationInternal() {
  window.__SPFxExtensions.Utils.ConfiguratorPageUrl = `${SPFX_EXTENSIONS_SITE_URL}/${CONFIGURATOR_PAGE_URL}`;
  try {
    // Optimistic: assume the extension is already installed (the installer is necessarily
    // an admin, so the infrastructure exists before regular users arrive). Reading the
    // config list throws when the data site / list is missing.
    await getConfigurationListData();
  } catch (err) {
    logGenericCoreInfo("SPFx Extensions not provisioned; installing.", err);
    await provisionInstall();
  }
}

async function getCoreConfig(fresh = false): Promise<ConfigurationListBaseData[]> {
  await ensureCoreConfiguration();
  return getConfigurationListData(fresh);
}

/**
 * Reads a single global setting's raw value by its `Title`, or `undefined` when absent.
 */
async function getCoreConfigValue(title: ConfigurationListBaseData["Title"], fresh = false) {
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
