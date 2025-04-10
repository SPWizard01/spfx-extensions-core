import type { SPFxExtensionAppRuntimeConfig } from "../models/appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
  SPFxExtensionAppRegistration,
} from "../models/appModel";
import type { SPFxExtensionAppUtils } from "../models/appUtils";
import type { ContextChangeEventDetails, HistoryEventDetails } from "../models/customEvents";
import type {
  SPFxExtensionAppEventListener,
  SPFxExtensionAppEvents,
  SPFxExtensionAppInstanceEventListener,
} from "../models/events";
import type { SPOPageContext } from "../models/spoContextInitializationData";



interface ModuleLoaderPromiseResult {
  context: {

    /**
     * PageContext from SPFx
     */
    pageContext: SPOPageContext;
  };
}

declare global {
  interface _spPageContextInfo {
    hubSiteId: string;
  }
  interface WindowEventMap {
    historyPush: CustomEvent<HistoryEventDetails>;
    historyReplace: CustomEvent<HistoryEventDetails>;
    historyBack: CustomEvent<HistoryEventDetails>;
    historyForward: CustomEvent<HistoryEventDetails>;
    historyGo: CustomEvent<HistoryEventDetails>;
    contextChange: CustomEvent<ContextChangeEventDetails>;
  }
  // interface ImportMeta {
  //   resolve: (url: string) => string;
  // }
  interface Window {
    // _spPageContextInfo?: any;
    _spBodyOnLoadFunctions?: any;
    _spBodyOnLoadCalled?: boolean;
    /**
     * Available only in SharePoint Modern Pages
     */
    moduleLoaderPromise?: Promise<ModuleLoaderPromiseResult>;
    MSOWebPartPageFormName?: string;
    MSOLayout_InDesignMode?: HTMLInputElement;
    MSOLayout_inDesignMode?: boolean;
    MSOLayout_IsWikiEditMode?: () => boolean;

    __SPFxExtensions: {
      /**
       * Most important part of Core solution, this promise is resolved when all core assets are loaded
       */
      __CorePromise: Promise<void>;
      /**
       * Called by Core solution when its ready to accept new apps
       */
      __CorePromiseResolver?(): void;

      __ConfiguratorUrl: string;

      AllAppAssetsLoadedPromise: Promise<void>;
      AllAppAssetsLoadedResolver(): void;

      Utils: SPFxExtensionAppUtils;
      Apps: SPFxExtensionAppDefinition[];
      /**
       * Runs the app, it has to be registered first via `window.__SPFxExtensions.RegisterApp`
       * 
       * If the app was not registered before calling this method, `Core` will queue it up.
       * 
       * It will be called once `window.__SPFxExtensions.RegisterApp` is called.
       * 
       * This method is called inside SPFx when applicable, otherwise it is up to the user to call this method.
       * 
       * @param appId appllication id to run
       * @param runTimeConfig runtime configuration for the app to use.
       */
      InstantiateApp(
        appId: string,
        runTimeConfig: SPFxExtensionAppRuntimeConfig
      ): Promise<SPFxExtensionAppInstance | undefined>;
      /**
       * Ensures that app is registered in global registry, returns app definition.
       * 
       * If app was registered earlier it might contain instances that need to be instantiated.
       * 
       * This will usually be done by `Core` however, in cases where apps are not in `ESM` format, it is up to the user to call this method.
       * 
       * @param app app definition
       */

      RegisterApp(
        app: SPFxExtensionAppRegistration
      ): Promise<SPFxExtensionAppDefinition | undefined>;

      /**
       * Unregisters app from global registry, removes all instances of the app.
       * @param appId application id to unregister
       */
      UnregisterApp(
        appId: string
      ): Promise<SPFxExtensionAppDefinition | undefined>;

      AppEventListeners: SPFxExtensionAppEventListener[];
      AddAppEventListener<
        K extends keyof SPFxExtensionAppEvents,
        R extends SPFxExtensionAppEvents[K]
      >(
        event: K,
        handler: (obj: R) => void
      ): SPFxExtensionAppEventListener;

      RemoveAppEventListener(
        list: SPFxExtensionAppInstanceEventListener
      ): void;

      ReloadSources?: string[];
    };
  }
}
