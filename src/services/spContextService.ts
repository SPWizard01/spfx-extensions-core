import { logGenericCoreError } from "../core/services/loggingService";


export async function getModernContextAsync() {
  if(window.moduleLoaderPromise) {
    const result = await window.moduleLoaderPromise;
    return result?.context;
  }
  logGenericCoreError("Unable to retrieve Modern SP Context...");
}

export async function getContextInfoAsync() {
  if (window.moduleLoaderPromise) {
    //modern context
    const result = await window.moduleLoaderPromise;
    if (result?.context?.pageContext) {
      return {
        contextType: "SPOModernContext" as const,
        context: result.context.pageContext,
      };
    }
    logGenericCoreError(
      "It seems this is a modern page, however it was not possible to retrieve SP Context..."
    );
  }
  if (window._spPageContextInfo) {
    return {
      contextType: "ClassicContext" as const,
      context: window._spPageContextInfo,
    };
  }
  throw "It was not possible to retrieve SP Context either through modern or through classic means...";
}

const emptySPFiContext = {
  web: {
    absoluteUrl: "",
  },
  legacyPageContext: {
    formDigestValue: "",
    formDigestTimeoutSeconds: 0,
  },
};


export async function getSPFiCompatibleContextAsync() {
  const ctxInfo = await getContextInfoAsync();
  const ctx =
    ctxInfo.contextType === "ClassicContext"
      ? ctxInfo.context
      : ctxInfo.context.legacyPageContext;

  if (ctx) {
    return {
      web: {
        absoluteUrl: ctx.webAbsoluteUrl,
      },
      legacyPageContext: {
        formDigestValue: ctx.formDigestValue,
        formDigestTimeoutSeconds: ctx.formDigestTimeoutSeconds,
      },
    };
  }
  logGenericCoreError("Unable to find context, returning empty context...");
  return emptySPFiContext;
}



export async function getCompatiblePageContextAsync() {
  const ctxInfo = await getContextInfoAsync();

  if (ctxInfo.contextType === "SPOModernContext") {
    return ctxInfo.context;
  }

  const usedContext = ctxInfo.context;

  const retCtx = {
    aadInfo: undefined,
    cultureInfo: {
      currentCultureName: usedContext.currentCultureName,
      currentUICultureName: usedContext.currentUICultureName,
      isRightToLeft: false,
    },
    isInitialized: true,
    legacyPageContext: usedContext,
    site: {
      absoluteUrl: usedContext.siteAbsoluteUrl,
      cdnPrefix: usedContext.cdnPrefix,
      classification: usedContext.siteClassification,
      id: { _guid: usedContext.siteId } as any,
      correlationId: { _guid: usedContext.CorrelationId } as any,
      group: { id: { _guid: usedContext.groupId }, type: -1 },
      isNoScriptEnabled: usedContext.isNoScriptEnabled,
      recycleBinItemCount: usedContext.RecycleBinItemCount,
      serverRelativeUrl: usedContext.siteServerRelativeUrl,
      serverRequestPath: usedContext.serverRequestPath,
      sitePagesEnabled: usedContext.sitePagesEnabled,
    },
    web: {
      absoluteUrl: usedContext.webAbsoluteUrl,
      description: usedContext.webDescription,
      id: { _guid: usedContext.webId } as any,
      isAppWeb: usedContext.isAppWeb,
      language: usedContext.webLanguage,
      logoUrl: usedContext.webLogoUrl,
      permissions: { _value: usedContext.webPermMasks } as any,
      serverRelativeUrl: usedContext.webServerRelativeUrl,
      templateName: usedContext.webTemplate,
      title: usedContext.webTitle,
      languageName: usedContext.currentCultureName,
    },
    user: {
      displayName: usedContext.userDisplayName,
      email: usedContext.userEmail,
      loginName: usedContext.userLoginName,
      isAnonymousGuestUser: usedContext.isAnonymousGuestUser,
      isExternalGuestUser: usedContext.isExternalGuestUser,
      preferUserTimeZone: usedContext.preferUserTimeZone,
    },
    listItem: {
      id: usedContext.pageItemId,
    },
    list: {
      id: usedContext.listId,
      title: usedContext.listTitle,
      serverRelativeUrl: usedContext.webServerRelativeUrl,
    },
  };
  return retCtx;
}