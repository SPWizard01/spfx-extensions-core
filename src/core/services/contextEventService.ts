import type { ContextChangeEventDetails } from "../../models/customEvents";

let contextServiceInitialized = false;
export function initializeContextEventService() {
    if (window.moduleLoaderPromise && !contextServiceInitialized) {
        contextServiceInitialized = true;
        window.moduleLoaderPromise.then((ctx) => {
            const originalInitialize = ctx.context.pageContext.initialize;
            ctx.context.pageContext.initialize = function (initializationData, legacyContext) {
                originalInitialize.call(this, initializationData, legacyContext);
                const detail: ContextChangeEventDetails = {
                    initializationData,
                    legacyContext
                };
                const event = new CustomEvent<ContextChangeEventDetails>("contextChange", {
                    detail
                });
                window.dispatchEvent(event);
                window.__SPFxExtensions.Apps.forEach((app) => {
                    app.instances.forEach((instance) => {
                        instance.executeListeners("onContextChange", detail);
                    });
                });
            };
        });
    }
}