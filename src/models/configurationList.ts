import { SPFX_EXTENSIONS_DATA_SITE } from "../utilities/constants";

export const ConfigurationNames = {
    Status: "Status",
    RootCDNLocation: "RootCDNLocation",
    InterceptHistory: "InterceptHistory",
    EnableAppWhiteList: "EnableAppWhiteList",
    AppCatalogUrl: "AppCatalogUrl",
    AppCatalogWebs: "AppCatalogWebs",
    ConfiguratorPageData: "ConfiguratorPageData",
    AppWhiteList: "AppWhiteList",
} as const;

const CoreDefaultConfiguration = [
    {
        Title: ConfigurationNames.Status,
        Data: "Installed",
    },
    {
        Title: ConfigurationNames.InterceptHistory,
        Data: "true",
    },
    {
        Title: ConfigurationNames.EnableAppWhiteList,
        Data: "false",
    },
    {
        Title: ConfigurationNames.RootCDNLocation,
        Data: `/sites/appcatalog/${SPFX_EXTENSIONS_DATA_SITE}`,
    }
];

export function getCoreDefaultConfiguration(cdnLocationUrl: string) {
    const cdnLoc = CoreDefaultConfiguration.find(c => c.Title === "RootCDNLocation");
    if (cdnLoc) {
        cdnLoc.Data = cdnLocationUrl;
    }
    return CoreDefaultConfiguration;
}

export interface ConfigurationListData {
    Title: typeof ConfigurationNames[keyof typeof ConfigurationNames];
    Data: any;
    date: string;
    expires: string;
}