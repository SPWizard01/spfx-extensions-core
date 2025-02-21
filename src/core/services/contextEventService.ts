let contextServiceInitialized = false;
export function initializeContextEventService() {
    if (window.moduleLoaderPromise && !contextServiceInitialized) {
        contextServiceInitialized = true;
        window.moduleLoaderPromise.then((ctx) => {
            const originalInitialize = ctx.context.pageContext.initialize;
            ctx.context.pageContext.initialize = function (this: any, partialNewContext: any, legacyContext: typeof window._spPageContextInfo) {
                originalInitialize.call(this, partialNewContext, legacyContext);
                const detail = {
                    partialNewContext,
                    legacyContext
                };
                const event = new CustomEvent("contextChange", {
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