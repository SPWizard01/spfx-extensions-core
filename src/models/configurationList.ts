import type { ConfigurationNames, RuntimeCacheNames } from "../core/utility/defaultConfig";

export interface ConfigurationListBaseData {
  Title: keyof typeof ConfigurationNames;
  Data: any;
}
export interface ConfigurationListData extends ConfigurationListBaseData {
  expires: string;
}

export interface RuntimeCacheBaseData {
  Title: keyof typeof RuntimeCacheNames;
  Data: any;
}
export interface RuntimeCacheData extends RuntimeCacheBaseData {
  expires: string;
}
