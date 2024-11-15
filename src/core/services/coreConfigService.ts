import type { ConfigurationListData } from "../../models/configurationList";
import { APPCOLLECTION_MANIFEST_NAME, CONFIGURATOR_PAGE_URL, SPFX_EXTENSIONS_DATA_SITE, WELL_KNOWN_MANIFEST_LOCATION } from "../../utilities/constants";
import { getAppCatalogUrlCached } from "./appCatalogService";
import { getConfigurationListData } from "./configurationListService";
import { ensureSPFxWeb } from "./configurationWebService";
import { ensureConfiguratorPage } from "./pageService";
import { ensureAppWhiteList } from "./whiteListService";

const appCatalogUrl = await getAppCatalogUrlCached();
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
    window.__SPFxExtensions.Utils.ConfiguratorUrl = `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}/${CONFIGURATOR_PAGE_URL}`;
}

export async function getCoreConfig(): Promise<ConfigurationListData[]> {
    await initializeCoreConfiguration();
    return getConfigurationListData();
}
export async function getRootCDNLocation() {
    const coreConfig = await getCoreConfig();
    const ROOT_CDN_LOCATION = coreConfig.find(c => c.Title === "RootCDNLocation")?.Data ?? `${appCatalogUrl}/${SPFX_EXTENSIONS_DATA_SITE}`;
    /**
     * Points to root sharepoint location into app catalog
     * OnPrem/SPO: ```/sites/appcatalog/CDN/SPFxExtensionApps/```
     */
    const ROOT_APPS_LOCATION = `${ROOT_CDN_LOCATION}${WELL_KNOWN_MANIFEST_LOCATION}`;
    /**
     * Points to root sharepoint manifest location
     * OnPrem/SPO: ```/sites/appcatalog/CDN/SPFxExtensionApps/apps.txt```
     */
    return `${ROOT_APPS_LOCATION}${APPCOLLECTION_MANIFEST_NAME}`;
}
