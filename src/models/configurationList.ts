export type ConfigurationNames = {
    Status: "Status",
    RootCDNLocation: "RootCDNLocation",
    InterceptHistory: "InterceptHistory",
    EnableAppWhiteList: "EnableAppWhiteList",
    AppCatalogUrl: "AppCatalogUrl",
    AppCatalogWebs: "AppCatalogWebs",
    ConfiguratorPageData: "ConfiguratorPageData",
    AppWhiteList: "AppWhiteList",
}


export interface ConfigurationListData {
    Title: keyof ConfigurationNames;
    Data: any;
    date: string;
    expires: string;
}