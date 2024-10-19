export interface HistoryEvents {
  onHistoryPush: Parameters<typeof window.history.pushState>;
  onHistoryReplace: Parameters<typeof window.history.replaceState>;
  onHistoryBack: never;
  onHistoryForward: never;
  onHistoryGo: Parameters<typeof window.history.go>;
}

export type HistoryEventListenerRemover = () => void;

export type HistoryEventListenerCallback = (...args: any) => void;

export type HistoryEventListener = {
  id: string;
  eventType: keyof HistoryEvents;
  callBack: HistoryEventListenerCallback;
};

export interface SPFxExtensionHistoryUtils {
  historyInterceptionInited?: boolean;
  originalPushState?: typeof window.history.pushState;
  originalReplaceState?: typeof window.history.replaceState;
  originalHistoryBack?: typeof window.history.back;
  originalHistoryForward?: typeof window.history.forward;
  originalHistoryGo?: typeof window.history.go;
  historyEventListeners?: HistoryEventListener[];
  addHistoryEventListener?<
    K extends keyof HistoryEvents,
    R extends HistoryEvents[K]
  >(
    eventName: K,
    callback: (...eventData: R) => void
  ): HistoryEventListenerRemover;
  removeHistoryEventListener?: (id: string) => void;
}
