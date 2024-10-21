export const ConfigurationNames = {
    Status: "Status",
    RootCDNLocation: "RootCDNLocation",
    ExtensionFolderName: "ExtensionFolderName",
    InterceptHistory: "InterceptHistory",
    EnableAppWhiteList: "EnableAppWhiteList",
    AppWhiteListName: "AppWhiteListName",
} as const;

export const CoreDefaultConfiguration = [
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
        Data: "true",
    },
    {
        Title: ConfigurationNames.AppWhiteListName,
        Data: "SPFxExtensionsWhiteList",
    },
    {
        Title: ConfigurationNames.RootCDNLocation,
        Data: "/sites/AppCatalog",
    }
];

export interface ConfigurationListData {
    Title: typeof ConfigurationNames[keyof typeof ConfigurationNames];
    Data: string;
    date: string;
    expires: string;
}