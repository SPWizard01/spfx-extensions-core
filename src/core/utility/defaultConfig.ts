import type {
  ConfigurationListBaseData,
  ConfigurationListData,
} from "../../models/configurationList";
import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";

export const ConfigurationNames = {
  RootCDNLocation: "RootCDNLocation",
  InterceptHistory: "InterceptHistory",
  EnableAppWhiteList: "EnableAppWhiteList",
  AppCatalogUrl: "AppCatalogUrl",
  SPFxDataSite: "SPFxDataSite",
  ConfiguratorPageData: "ConfiguratorPageData",
  AppWhiteList: "AppWhiteList",
  Version: BUILD_DATE,
} as const;

const CoreDefaultConfiguration: ConfigurationListBaseData[] = [
  {
    Title: "InterceptHistory",
    Data: "true",
  },
  {
    Title: "EnableAppWhiteList",
    Data: "false",
  },
  {
    Title: "RootCDNLocation",
    Data: `/sites/appcatalog/${SPFX_EXTENSIONS_DATA_SITE}`,
  },
];

export function getCoreDefaultConfiguration(cdnLocationUrl: string) {
  const cdnLoc = CoreDefaultConfiguration.find((c) => c.Title === "RootCDNLocation");
  if (cdnLoc) {
    cdnLoc.Data = cdnLocationUrl;
  }
  return CoreDefaultConfiguration;
}
