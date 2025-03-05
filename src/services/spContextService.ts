export async function getModernContextAsync() {
  if (window.moduleLoaderPromise) {
    const result = await window.moduleLoaderPromise;
    return result?.context;
  }
  console.error("Unable to retrieve Modern SP Context...");
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
    throw "It seems this is a modern page, however it was not possible to retrieve SP Context...";
  }
  if (window._spPageContextInfo) {
    return {
      contextType: "ClassicContext" as const,
      context: window._spPageContextInfo,
    };
  }
  throw "It was not possible to retrieve SP Context either through modern or through classic means...";
}

