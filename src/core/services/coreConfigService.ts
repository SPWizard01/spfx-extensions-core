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
 * Points to root sharepoint location into app catalog
 * OnPrem/SPO: ```{APP_CATALOG_URL}/SPFxExtensionsData/SPFxExtensions/```
 */
export async function getRootCDNLocation() {
  const coreConfig = await getCoreConfig();
  const ROOT_CDN_LOCATION =
    coreConfig.find((c) => c.Title === "RootCDNLocation")?.Data ?? `${SPFX_EXTENSIONS_SITE_URL}`;

  const ROOT_APPS_LOCATION = `${ROOT_CDN_LOCATION}${WELL_KNOWN_MANIFEST_LOCATION}`;
  return ROOT_APPS_LOCATION;
}
