import type { SPFxExtensionAppRuntimeConfigBase } from "./appConfig";
import type {
  SPFxExtensionAppDefinitionBase,
  SPFxExtensionAppInstanceBase,
  SPFxExtensionAppInstanceRequestedDetails,
} from "./appModel";
import type { SPFxExtensionCleanup } from "./events";

interface SPFxExtensionAppAdaptiveCardNavigator {
  /**
   * Current size of the View stack.
   */
  size: number;
  /* Excluded from this release type: _currentView */
  /**
   * Get the id of the currently rendered View from the top of the View stack
   * @remarks If the stack is empty, this will return undefined
   */
  currentId: string | undefined;
  push(id: string, skipUpdate?: boolean): void;
  replace(id: string, skipUpdate?: boolean): void;
  pop(skipUpdate?: boolean): void;
}

interface SPFxExtensionAppAdaptiveCardQuickViewNavigator
  extends SPFxExtensionAppAdaptiveCardNavigator {
  close(): void;
}

//instance type as separate type
type SPFxExtensionAppAdaptiveCardInstanceType = {
  instanceType: "adaptiveCard";
};

type SPFxExtensionAppAdaptiveCardRuntimeConfigBase<TConfig = unknown> =
  SPFxExtensionAppRuntimeConfigBase<TConfig> & SPFxExtensionAppAdaptiveCardInstanceType;
/**
 * Will be supplied by SPFx when the adaptive card is instantiated
 */
export interface SPFxExtensionAppAdaptiveCardRuntimeConfig<TConfig = unknown>
  extends SPFxExtensionAppAdaptiveCardRuntimeConfigBase<TConfig> {
  //things that are specific to adaptive card extension
  cardExtension: any;
  setState(newState: any): void;
  cardSize(): "Medium" | "Large";
  renderType(): "Card" | "QuickView";
  quickViewNavigator(): SPFxExtensionAppAdaptiveCardQuickViewNavigator;
  cardNavigator(): SPFxExtensionAppAdaptiveCardNavigator;
  displayMode(): "Read" | "Edit";
}

export type SPFxExtensionAppAdaptiveCardViewType =
  | "BasicCardView"
  | "BarChartCardView"
  | "LineChartCardView"
  | "PieChartCardView"
  | "ImageCardView"
  | "SearchCardView"
  | "TextInputCardView"
  | "TextInputImageCardView"
  | "PrimaryTextCardView";

export interface SPFxExtensionAppAdaptiveCardRegistrators {
  RegisterViewCard(viewId: string, type: SPFxExtensionAppAdaptiveCardViewType): void;
  RegisterQuickView(viewId: string): void;
  RegisterWebQuickView(viewId: string): void;
}

type SPFxExtensionAppAdaptiveCardAdditionalProps = SPFxExtensionAppAdaptiveCardInstanceType & {
  //important methods that the user needs to implement
  registerViews?(registrators: SPFxExtensionAppAdaptiveCardRegistrators): Promise<void>;
  renderCard?(): string;

  loadPropertyPaneResources?(): Promise<void>;
  getCardViewParameters?(viewId: string): Object;

  // called either for QuickView or Card action
  onAction?(viewId: string, actionData: Object): void;
  onBeforeAction?(viewId: string, actionData: Object): void;

  onCardSelection?(viewId: string): any;

  renderWebQuickView?(viewId: string, element: HTMLElement): void;
  /**
   * This method should return JSON data for the quick view template
   *
   * Check https://adaptivecards.microsoft.com/designer for more details
   * @param viewId - id of the quick view
   */
  getQuickViewData?(viewId: string): any;
  /**
   * This method should return Adaptive Card JSON
   *
   * Check https://adaptivecards.microsoft.com/?topic=AdaptiveCard for more details
   * @param viewId - id of the quick view
   */
  getQuickViewTemplate?(viewId: string): any;
  onQuickViewFocusParameter?(viewId: string): any;

  onDisplayModeChanged?(newDisplayMode: "Read" | "Edit"): void;
  onRenderTypeChanged?(newRenderType: "Card" | "QuickView"): void;
  onDispose?(): void;
};

type SPFxExtensionAppAdaptiveCardInstanceBase<TConfig = unknown> =
  SPFxExtensionAppInstanceBase<TConfig> &
    SPFxExtensionAppAdaptiveCardRuntimeConfig<TConfig> &
    SPFxExtensionAppAdaptiveCardAdditionalProps;

/**
 * Will be supplied by Core when the adaptive card instance is created
 */
export interface SPFxExtensionAppAdaptiveCardInstance<TConfig = unknown>
  extends SPFxExtensionAppAdaptiveCardInstanceBase<TConfig> {
  // onInitRegisterViews(cardNavigator: any, quickViewNavigator: any): Promise<void>;
}

type SPFxExtensionAppAdaptiveCardDefinitionBase =
  SPFxExtensionAppInstanceRequestedDetails<SPFxExtensionAppAdaptiveCardInstance> &
    SPFxExtensionAppDefinitionBase &
    SPFxExtensionAppAdaptiveCardInstanceType;

/**
 * Should be implemented by the user
 */
export interface SPFxExtensionAppAdaptiveCardDefinition
  extends SPFxExtensionAppAdaptiveCardDefinitionBase {}

export interface SPFxExtensionEnsuredAppAdaptiveCardDefinition
  extends SPFxExtensionAppAdaptiveCardDefinition {
  registrationCompleted: boolean;
}
