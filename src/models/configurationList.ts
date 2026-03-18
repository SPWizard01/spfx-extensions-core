import type { ConfigurationNames } from "../core/utility/defaultConfig";

export interface ConfigurationListBaseData {
  Title: keyof typeof ConfigurationNames;
  Data: any;
}
export interface ConfigurationListData extends ConfigurationListBaseData {
  expires: string;
}
