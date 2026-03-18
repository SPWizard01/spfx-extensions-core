import type { SPFxExtensionAppEventListener } from "../../models/events";
import { logGenericCoreDebug } from "./loggingService";

function removeAppEventListener(
  eventListener: SPFxExtensionAppEventListener
) {
  const idx = window.__SPFxExtensions.AppEventListeners.findIndex(
    (el) => el.key === eventListener.key
  );
  if (idx > -1) {
    logGenericCoreDebug("Removing event listener", eventListener);
    window.__SPFxExtensions.AppEventListeners.splice(idx, 1);
  }
};

export function registerGlobalListeners() {
  if (!window.__SPFxExtensions.AppEventListeners) {
    window.__SPFxExtensions.AppEventListeners = [];
  }

  if (!window.__SPFxExtensions.AddAppEventListener) {
    window.__SPFxExtensions.AddAppEventListener = (ev, handler) => {
      const el = {
        key: window.crypto.randomUUID(),
        eventName: ev,
        handler: handler,
      };
      window.__SPFxExtensions.AppEventListeners.push(el);
      return () => {
        removeAppEventListener(el);
      };
    };
  }

  if (!window.__SPFxExtensions.RemoveAppEventListener) {
    window.__SPFxExtensions.RemoveAppEventListener = (listener) => {
      const lisIdx = window.__SPFxExtensions.AppEventListeners.findIndex(
        (l) => l.key === listener.key
      );
      if (lisIdx > -1) {
        window.__SPFxExtensions.AppEventListeners.splice(lisIdx, 1);
      }
    };
  }
}
