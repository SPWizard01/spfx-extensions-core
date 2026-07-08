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
 * How a setting is rendered and edited in the configurator's global settings form.
 */
export type SettingControlType = "boolean" | "text" | "url";

export interface SettingDescriptor {
  /** Which editor control the configurator renders for this setting. */
  type: SettingControlType;
  /** Human-readable label shown in the settings form. */
  label: string;
  /** Optional helper text shown under the field. */
  description?: string;
  /** Default value used when the setting is absent from the list. */
  default: string;
}

/**
 * Single source of truth for every setting: its default value and how it is rendered.
 * `RootCDNLocation`'s default resolves to the data-site URL at runtime (see
 * `getDefaultSettings`), so its static `default` here is unused.
 */
export const SettingDescriptors: Record<keyof typeof ConfigurationNames, SettingDescriptor> = {
  RootCDNLocation: {
    type: "url",
    label: "Root CDN location",
    description: "Base URL the root apps and their manifests are served from.",
    default: "",
  },
  InterceptHistory: {
    type: "boolean",
    label: "Intercept history",
    description: "Re-scan applications on client-side (SPA) navigations.",
    default: "true",
  },
  EnableAppWhiteList: {
    type: "boolean",
    label: "Enable app whitelist",
    description: "Only allow apps present in the whitelist to execute.",
    default: "false",
  },
  UsePublicCDNForManifests: {
    type: "boolean",
    label: "Use public CDN for manifests",
    description: "Fetch manifest.json / collectionconfig.json through the SharePoint public CDN.",
    default: "false",
  },
};

/**
 * Returns a fresh, complete list of default settings on every call so callers can never
 * mutate shared state. `RootCDNLocation` defaults to the resolved data-site URL.
 */
export function getDefaultSettings(rootCdnLocationUrl: string): ConfigurationListBaseData[] {
  const titles = Object.keys(SettingDescriptors) as (keyof typeof ConfigurationNames)[];
  return titles.map((title) => ({
    Title: title,
    Data: title === "RootCDNLocation" ? rootCdnLocationUrl : SettingDescriptors[title].default,
  }));
}
