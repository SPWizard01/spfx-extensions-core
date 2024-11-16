import type { SPFxExtensionAppRuntimeConfig } from "../models/appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
  SPFxExtensionAppRegistration,
} from "../models/appModel";
import type { SPFxExtensionAppUtils } from "../models/appUtils";
import type { ConfigurationListData } from "../models/configurationList";
import type {
  SPFxExtensionAppContextInjection,
  SPOnlineContextInjection,
} from "../models/context";
import type {
  SPFxExtensionAppEvents,
  SPFxExtensionAppInstanceEventListener,
  SPFxExtensionAppEventListener,
} from "../models/events";
import type { SPFxExtensionImportCallback } from "../models/importLoader";

interface ModuleLoaderPromiseResult {
  context: {
    /**
     * PageContext from SPFx
     */
    pageContext: any;
  };
}

declare global {
  interface This {
    //asd: string[];
  }
  // interface ImportMeta {
  //   resolve: (url: string) => string;
  // }
  interface Window {
    _spPageContextInfo?: any;
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
       * Required to build `window.__SPFxExtensions` object, initializes Core solution, ensures that its called only once;
       */
      __CoreInitialized?: boolean;
      /**
       * Most important part of Core solution, this promise is resolved when all core assets are loaded
       */
      __CorePromise: Promise<void>;
      /**
       * Called by Core solution when its ready to accept new apps
       */
      __CorePromiseResolver?(): void;

      __ConfiguratorUrl: string;

      ImportCallbacks: SPFxExtensionImportCallback[];

      AppLoadInitialized: boolean;
      LoadedAppAssets: string[];
      AllAppAssetsLoadedPromise: Promise<void>;
      AllAppAssetsLoadedResolver(): void;

      Utils: SPFxExtensionAppUtils;
      Apps: SPFxExtensionAppDefinition[];
      LoadApp(
        appId: string,
        runTimeConfig: SPFxExtensionAppRuntimeConfig
      ): Promise<SPFxExtensionAppInstance | undefined>;
      /**
       * Ensures that app is registered in global registry, returns app definition.
       * if app was registered earlier it might contain instances
       * @param app app definition
       */

      RegisterApp(
        app: SPFxExtensionAppRegistration
      ): Promise<SPFxExtensionAppDefinition | null>;

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

      // MIGHT NOT BE NEEDED
      SPContextInjection: SPFxExtensionAppContextInjection | undefined;
      OnlineInjector: SPOnlineContextInjection | undefined;
      ReloadSources?: string[];
    };
  }
}
