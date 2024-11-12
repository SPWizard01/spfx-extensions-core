export const ConfigurationNames = {
    Status: "Status",
    RootCDNLocation: "RootCDNLocation",
    ExtensionFolderName: "ExtensionFolderName",
    InterceptHistory: "InterceptHistory",
    EnableAppWhiteList: "EnableAppWhiteList",
    AppWhiteListName: "AppWhiteListName",
    AppCatalogUrl: "AppCatalogUrl",
} as const;

const CoreDefaultConfiguration = [
    {
        Title: ConfigurationNames.Status,
        Data: "Installed",
    },
    {
        Title: ConfigurationNames.ExtensionFolderName,
        Data: "SPFxExtensions",
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
        Title: ConfigurationNames.AppWhiteListName,
        Data: "SPFxExtensionsWhiteList",
    },
    {
        Title: ConfigurationNames.RootCDNLocation,
        Data: "/sites/appcatalog",
    }
];

export function getCoreDefaultConfiguration(appCatalogUrl: string) {
    const cdnLoc = CoreDefaultConfiguration.find(c => c.Title === "RootCDNLocation");
    if (cdnLoc) {
        cdnLoc.Data = appCatalogUrl;
    }
    return CoreDefaultConfiguration;
}

export interface ConfigurationListData {
    Title: typeof ConfigurationNames[keyof typeof ConfigurationNames];
    Data: string;
    date: string;
    expires: string;
}