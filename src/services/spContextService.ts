
function getModernOnPremContextInfo() {
  if (window.__SPFxExtensions.SPContextInjection?.context) {
    return window.__SPFxExtensions.SPContextInjection.context;
  }
  const injectionPoint = "spClientSidePageContext=";
  const xpath = `//script[contains(text(),'${injectionPoint}')]`;

  const matchingElement = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue as HTMLElement | undefined;
  
  const injection =
    matchingElement?.innerHTML?.replace(
      "(window)",
      "(window.__SPFxExtensions.SPContextInjection)"
    ) ??
    `console.error('Could not find injection target for ${injectionPoint}')`;

  window.__SPFxExtensions.SPContextInjection = {
    location: {
      href: "",
    },
    context: undefined,
    spModuleLoader: {
      start: (ctx: any, _failureFunc: () => void) => {
        window.__SPFxExtensions.SPContextInjection!.context = ctx;
        return new Promise<void>((resolve) => {
          resolve();
        });
      },
    },
  };
  try {
    eval(injection);
  } catch {
    console.error("Error while evaluating Modern context injection");
  }
  if (!window.__SPFxExtensions.SPContextInjection.context) {
    console.error(
      "SPReactContext could not be constructed, is this page in Modern mode?"
    );
  }
  return window.__SPFxExtensions.SPContextInjection.context;
}

function getOnlineContextInfo() {
  if (window.__SPFxExtensions.OnlineInjector?.context) {
    return window.__SPFxExtensions.OnlineInjector.context;
  }
  const onlineInjectionPoint =
    "window.moduleLoaderPromise=spModuleLoader.start";
  //spo also has this...
  //global.moduleLoaderPromise = global.spModuleLoader.start
  window.__SPFxExtensions.OnlineInjector = {
    context: undefined,
    start: (obj: any) => {
      window.__SPFxExtensions.OnlineInjector!.context = obj;
      return new Promise<void>((rslv) => {
        rslv();
      });
    },
  };

  const xpath = `//script[contains(text(),'${onlineInjectionPoint}')]`;
  const matchingElement = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue as HTMLElement | undefined;
  const inj =
    matchingElement?.innerHTML.replace(
      onlineInjectionPoint,
      "window.__SPFxExtensions.OnlineInjector.start"
    ) ??
    `console.error('Could not find injection target for ${onlineInjectionPoint}')`;
  eval(inj);
  return window.__SPFxExtensions.OnlineInjector.context;
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
    console.error(
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
  console.error("Unable to find context, returning empty context...");
  return emptySPFiContext;
}
