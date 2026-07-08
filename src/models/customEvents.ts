import type { ConfigurationListBaseData } from "./configurationList";
import type { SPOContextInitializationData } from "./spoContextInitializationData";

export interface HistoryEventDetails {
  currentState: any;
  newState?: any;
  previousUrl: string;
  newUrl?: string | URL | null | undefined;
  delta?: number;
}

export interface ContextChangeEventDetails {
  /**
   * This will only contain new data of the SPFx context object, but will not have the rest.
   * i.e. `web` will be an object instead of an accessor.
   */
  initializationData: SPOContextInitializationData;
  legacyContext: typeof window._spPageContextInfo;
  previousContext: SPOContextInitializationData;
}

export interface ConfigChangeEventDetails {
  /** The current global settings after the change, as stored in the configuration list. */
  current: ConfigurationListBaseData[];
}
