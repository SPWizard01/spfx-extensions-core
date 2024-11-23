import { SPBrowser, SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/webs";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { getModernContextAsync } from "../../services/spContextService";
import { getConfiguringWebUrl } from "./webConfiguratorService";
const modernContext = await getModernContextAsync();
export function getPnPSP(webUrl = "") {
    const web = webUrl ? webUrl : getWebAbsoluteUrl();
    if (!modernContext) {
        return spfi(web).using(SPBrowser());
    }
    return spfi(web).using(SPFx(modernContext as any));
}

export function getWebUrlFromSP(sp: SPFI) {
    return sp.web.toUrl().replace("/_api/web", "");
}

export function getConfigurationSP() {
    const queryWeb = getConfiguringWebUrl();
    const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
    return getPnPSP(cfgWeb);
}