import type { SPFxExtensionAppRuntimeConfigBase } from "./appConfig";
import type {
  SPFxExtensionAppDefinitionBase,
  SPFxExtensionAppInstanceBase,
  SPFxExtensionAppInstanceRequestedDetails,
} from "./appModel";

export interface SPFxExtensionAppWebpartAdditionalProps {
  instanceType: "webpart";
  domElement: HTMLElement;
  webpart: any;
  /**
   * @param actions Actions that you want to set as top actions in the top action bar
   * Check `ITopActionsField` from `@microsoft/sp-top-actions` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-top-actions/itopactionsfield?view=sp-typescript-latest
   */
  setTopActions(actions: any[]): void;
  /**
   * Check `ITopActionsField` from `@microsoft/sp-top-actions` package for more details.
   *
   * https://learn.microsoft.com/en-us/javascript/api/sp-top-actions/itopactionsfield?view=sp-typescript-latest
   */
  getTopActions(): any[];
}

type SPFxExtensionAppWebpartRuntimeConfigBase<TConfig = unknown> =
  SPFxExtensionAppRuntimeConfigBase<TConfig> & SPFxExtensionAppWebpartAdditionalProps;

/**
 * Will be supplied by SPFx when the web part is instantiated
 */
export interface SPFxExtensionAppWebpartRuntimeConfig<TConfig = unknown>
  extends SPFxExtensionAppWebpartRuntimeConfigBase<TConfig> {}

/**
 * Will be supplied by Core when the web part instance is created
 */
export type SPFxExtensionAppWebpartInstance<TConfig = unknown> =
  SPFxExtensionAppInstanceBase<TConfig> &
    SPFxExtensionAppWebpartAdditionalProps &
    SPFxExtensionAppRuntimeConfigBase<TConfig>;

type SPFxExtensionAppWebpartDefinitionBase =
  SPFxExtensionAppInstanceRequestedDetails<SPFxExtensionAppWebpartInstance> &
    SPFxExtensionAppDefinitionBase;

/**
 * Should be implemented by the user
 */
export interface SPFxExtensionAppWebpartDefinition extends SPFxExtensionAppWebpartDefinitionBase {
  instanceType: "webpart";
}
export interface SPFxExtensionEnsuredAppWebpartDefinition
  extends SPFxExtensionAppWebpartDefinition {
  registrationCompleted: boolean;
}
