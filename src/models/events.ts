import type {
  SPFxExtensionAppConfig,
  SPFxExtensionAppPropertyPaneConfigRender,
} from "./appConfig";
import type {
  SPFxExtensionAppDefinition,
  SPFxExtensionAppInstance,
} from "./appModel";
import type { ContextChangeEventDetails } from "./customEvents";
import type { CompatibleDisplayMode } from "./environment";

/**
 * A method that can be called to remove the registered Event Listener for the instance.
 * It will be called automatically on app unmount. Unless you want to call it earlier.
 */
export type SPFxExtensionAppEventCleanup = () => void;
export type SPFxExtensionTopActionEvent = {
  actionName: string;
  updatedValue: any;
}

export type SPFxExtensionResizeEvent = {
  newWidth: number;
}

export type SPFxExtensionAppInstanceEvents = {
  onConfigurationRender: SPFxExtensionAppPropertyPaneConfigRender;
  onConfigurationClose: Partial<SPFxExtensionAppPropertyPaneConfigRender>;
  onConfigurationChange: SPFxExtensionAppConfig;
  onDisplayModeChange: CompatibleDisplayMode;
  contextChange: ContextChangeEventDetails;
  contextRefresh: ContextChangeEventDetails;
  onPlaceholdersChanged: any;
  onThemeChange: any;
  onTopActionExecute: SPFxExtensionTopActionEvent;
  onAppCustomizerDisposed: undefined;
  onRender: undefined;
  onPropertyPaneChangesApplied: undefined;
  onAfterResize: SPFxExtensionResizeEvent;
};

export type SPFxExtensionAppInstanceEventListener<T extends keyof SPFxExtensionAppInstanceEvents = keyof SPFxExtensionAppInstanceEvents> = {
  key: string;
  eventName: T;
  handler(eventData?: SPFxExtensionAppInstanceEvents[T]): void;
};

export type SPFxExtensionAppEvents = {
  appAdded: SPFxExtensionAppDefinition;
  instanceAdded: {
    app: SPFxExtensionAppDefinition;
    instance: SPFxExtensionAppInstance;
  };
};

export type SPFxExtensionAppEventListener<T extends keyof SPFxExtensionAppEvents = keyof SPFxExtensionAppEvents> = {
  key: string;
  eventName: T;
  handler(eventData?: SPFxExtensionAppEvents[T]): void;
};
