export const ConfigurationNames = {
    Status: "Status",
    CoreUrl: "CoreUrl",
    InterceptHistory: "InterceptHistory",
    EnableAppWhiteList: "EnableAppWhiteList",
} as const;

export const CoreDefaultConfiguration = [
    {
        Title: ConfigurationNames.Status,
        Data: "Installed",
    },
    {
        Title: ConfigurationNames.CoreUrl,
        Data: "/sites/AppCatalog/CDN/SPFxExtensionCore/core.js",
    },
    {
        Title: ConfigurationNames.InterceptHistory,
        Data: "true",
    },
    {
        Title: ConfigurationNames.EnableAppWhiteList,
        Data: "true",
    }
];

export interface ConfigurationListData {
    Title: typeof ConfigurationNames[keyof typeof ConfigurationNames];
    Data: string;
    date: string;
    expires: string;
}