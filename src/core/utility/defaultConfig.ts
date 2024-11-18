import type { ConfigurationListData } from "../../models/configurationList";
import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";

const CoreDefaultConfiguration: Partial<ConfigurationListData>[] = [
    {
        Title: "Status",
        Data: "Installed",
    },
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
    }
];

export function getCoreDefaultConfiguration(cdnLocationUrl: string) {
    const cdnLoc = CoreDefaultConfiguration.find(c => c.Title === "RootCDNLocation");
    if (cdnLoc) {
        cdnLoc.Data = cdnLocationUrl;
    }
    return CoreDefaultConfiguration;
}