import type { SPOContextInitializationData } from "./spoContextInitializationData"

export interface HistoryEventDetails {
    currentState: any,
    newState?: any,
    previousUrl: string,
    newUrl?: string | URL | null | undefined,
    delta?: number
}

export interface ContextChangeEventDetails {
    /**
     * This will only contain new data of the SPFx context object, but will not have the rest.
     * i.e. `web` will be an object instead of an accessor.
     */
    initializationData: SPOContextInitializationData,
    legacyContext: typeof window._spPageContextInfo
}