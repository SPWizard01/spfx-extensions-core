import { SPBrowser, SPFI, spfi, SPFx, type ISPFXContext } from "@pnp/sp";
import "@pnp/sp/batching";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/sites";
import "@pnp/sp/webs";
import { getWebAbsoluteUrl } from "../../core/services/contextService";
import { getConfiguringWebUrl } from "./webConfiguratorService";
export function getPnPSP(webAbsoluteUrl = "") {
  const web = webAbsoluteUrl ? webAbsoluteUrl : getWebAbsoluteUrl();
  if (!window.__SPFxExtensions.__CurrentContext) {
    return spfi(web).using(SPBrowser());
  }
  let ctxToUse: ISPFXContext;
  if (window.__SPFxExtensions.__CurrentContext.contextType === "SPOModernContext") {
    ctxToUse = {
      pageContext: {
        web: {
          absoluteUrl: window.__SPFxExtensions.__CurrentContext.context.web.absoluteUrl,
        },
        legacyPageContext: {
          formDigestTimeoutSeconds:
            window.__SPFxExtensions.__CurrentContext.context.legacyPageContext
              .formDigestTimeoutSeconds,
          formDigestValue:
            window.__SPFxExtensions.__CurrentContext.context.legacyPageContext.formDigestValue,
        },
      },
    };
  } else {
    ctxToUse = {
      pageContext: {
        web: {
          absoluteUrl: window.__SPFxExtensions.__CurrentContext.context.webAbsoluteUrl,
        },
        legacyPageContext: {
          formDigestTimeoutSeconds:
            window.__SPFxExtensions.__CurrentContext.context.formDigestTimeoutSeconds,
          formDigestValue: window.__SPFxExtensions.__CurrentContext.context.formDigestValue,
        },
      },
    };
  }
  return spfi(web).using(SPFx(ctxToUse));
}

export function getWebUrlFromSP(sp: SPFI) {
  return sp.web.toUrl().replace("/_api/web", "");
}

export function getPnPSPForConfigurationWeb() {
  const queryWeb = getConfiguringWebUrl();
  const cfgWeb = queryWeb ?? getWebAbsoluteUrl();
  return getPnPSP(cfgWeb);
}
