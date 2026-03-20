import type { ContextChangeEventDetails } from "../../models/customEvents";
import type { SPFxExtensionAppInstanceEvents } from "../../models/events";

let contextServiceInitialized = false;
export function initializeContextEventService() {
  if (window.moduleLoaderPromise && !contextServiceInitialized) {
    contextServiceInitialized = true;
    window.moduleLoaderPromise.then((ctx) => {
      const originalInitialize = ctx.context.pageContext.initialize;
      ctx.context.pageContext.initialize = function (initializationData, legacyContext) {
        const previousContext = ctx.context.pageContext._initializationData;
        originalInitialize.call(this, initializationData, legacyContext);
        const detail: ContextChangeEventDetails = {
          initializationData,
          legacyContext,
          previousContext,
        };
        //MS does not guarantee that web ids are unique...
        const sameWebId = previousContext.web.id === initializationData.web.id;
        const sameSiteId = previousContext.site.id === initializationData.site.id;
        if (sameWebId && sameSiteId) {
          dispatchCoreEvent("contextRefresh", detail);
          return;
        }
        dispatchCoreEvent("contextChange", detail);
      };
    });
  }
}

function dispatchCoreEvent(
  eventName: keyof SPFxExtensionAppInstanceEvents,
  detail: ContextChangeEventDetails
) {
  const event = new CustomEvent<ContextChangeEventDetails>(eventName, {
    detail,
  });
  window.dispatchEvent(event);
  window.__SPFxExtensions.Apps.forEach((app) => {
    app.instances.forEach((instance) => {
      instance.executeListeners(eventName, detail);
    });
  });
}
