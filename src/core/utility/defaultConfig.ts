import type { ConfigurationListBaseData } from "../../models/configurationList";

/**
 * User-tunable settings persisted in the `SPFxExtensionsConfiguration` SharePoint list
 * and cached in the `SPFxExtensionConfig` IndexedDB store.
 */
export const ConfigurationNames = {
  RootCDNLocation: "RootCDNLocation",
  InterceptHistory: "InterceptHistory",
  EnableAppWhiteList: "EnableAppWhiteList",
  UsePublicCDNForManifests: "UsePublicCDNForManifests",
} as const;

/**
 * Bootstrap primitives and ensure-results that are discovered or derived at runtime
 * (not user settings). Cached in the separate `SPFxRuntimeCache` IndexedDB store.
 */
export const RuntimeCacheNames = {
  AppCatalogUrl: "AppCatalogUrl",
  SPFxDataSite: "SPFxDataSite",
  ConfiguratorPageData: "ConfiguratorPageData",
  AppWhiteList: "AppWhiteList",
} as const;

/**
 * Returns a fresh, complete list of default settings on every call so callers can never
 * mutate shared state. `RootCDNLocation` defaults to the resolved data-site URL.
 */
export function getDefaultSettings(rootCdnLocationUrl: string): ConfigurationListBaseData[] {
  return [
    { Title: "RootCDNLocation", Data: rootCdnLocationUrl },
    { Title: "InterceptHistory", Data: "true" },
    { Title: "EnableAppWhiteList", Data: "false" },
    { Title: "UsePublicCDNForManifests", Data: "false" },
  ];
}
