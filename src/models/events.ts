import type { SPFxExtensionAppConfig, SPFxExtensionAppPropertyPaneConfigRender } from "./appConfig";
import type { SPFxExtensionAppDefinition, SPFxExtensionAppInstance } from "./appModel";
import type { ContextChangeEventDetails } from "./customEvents";
import type { CompatibleDisplayMode } from "./environment";

/**
 * It will be called automatically on app unmount. Unless you want to call it earlier.
 */
export type SPFxExtensionCleanup = () => void;
export type SPFxExtensionTopActionEvent = {
  actionName: string;
  updatedValue: any;
};

export type SPFxExtensionResizeEvent = {
  newWidth: number;
};

export type SPFxExtensionAppInstanceEvents<TConfig = unknown> = {
  onConfigurationRender: SPFxExtensionAppPropertyPaneConfigRender;
  onConfigurationClose: Partial<SPFxExtensionAppPropertyPaneConfigRender>;
  onConfigurationChange: SPFxExtensionAppConfig<TConfig>;
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

export type SPFxExtensionAppInstanceEventListener<
  TConfig = unknown,
  T extends
    keyof SPFxExtensionAppInstanceEvents<TConfig> = keyof SPFxExtensionAppInstanceEvents<TConfig>,
> = {
  key: string;
  eventName: T;
  handler(eventData?: SPFxExtensionAppInstanceEvents<TConfig>[T]): void;
};

export type SPFxExtensionAppEvents = {
  appAdded: SPFxExtensionAppDefinition;
  instanceAdded: {
    app: SPFxExtensionAppDefinition;
    instance: SPFxExtensionAppInstance;
  };
};

export type SPFxExtensionAppEventListener<
  T extends keyof SPFxExtensionAppEvents = keyof SPFxExtensionAppEvents,
> = {
  key: string;
  eventName: T;
  handler(eventData?: SPFxExtensionAppEvents[T]): void;
};
