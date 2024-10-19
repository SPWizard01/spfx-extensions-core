function interceptHistoryPushState() {
  function _pushState(
    this: any,
    data: any,
    unused: string,
    url?: string | URL
  ) {
    const _defaultPushState =
      window.__SPFxExtensions.Utils.originalPushState;
    updateEditMode(url);
    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    _defaultPushState?.apply(this, [data, unused, url]);
    var listeners =
      window.__SPFxExtensions.Utils.historyEventListeners?.filter(
        (l) => l.eventType === "onHistoryPush"
      ) || [];
    listeners.forEach((l) => {
      l.callBack(data, unused, url);
    });
  }
  window.history.pushState = _pushState;
}

function interceptHistoryReplaceState() {
  function _replaceState(
    this: any,
    data: any,
    unused: string,
    url?: string | URL
  ) {
    const _defaultReplaceState =
      window.__SPFxExtensions.Utils.originalReplaceState;
    updateEditMode(url);

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    _defaultReplaceState?.apply(this, [data, unused, url]);
    var listeners =
      window.__SPFxExtensions.Utils.historyEventListeners?.filter(
        (l) => l.eventType === "onHistoryReplace"
      ) || [];
    listeners.forEach((l) => {
      l.callBack(data, unused, url);
    });
  }
  window.history.replaceState = _replaceState;
}

function interceptHistoryBack() {
  function _goBack(this: any) {
    const _defaultFunction =
      window.__SPFxExtensions.Utils.originalHistoryBack;

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    _defaultFunction?.apply(this);
    updateEditMode(window.location.href);
    var listeners =
      window.__SPFxExtensions.Utils.historyEventListeners?.filter(
        (l) => l.eventType === "onHistoryBack"
      ) || [];
    listeners.forEach((l) => {
      l.callBack();
    });
  }
  window.history.back = _goBack;
}

function interceptHistoryForward() {
  function _goForward(this: any) {
    const _defaultFunction =
      window.__SPFxExtensions.Utils.originalHistoryForward;

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    _defaultFunction?.apply(this);
    updateEditMode(window.location.href);
    var listeners =
      window.__SPFxExtensions.Utils.historyEventListeners?.filter(
        (l) => l.eventType === "onHistoryForward"
      ) || [];
    listeners.forEach((l) => {
      l.callBack();
    });
  }
  window.history.forward = _goForward;
}

function interceptHistoryGo() {
  function _go(this: any, delta: number | undefined) {
    const _defaultFunction =
      window.__SPFxExtensions.Utils.originalHistoryGo;

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    _defaultFunction?.apply(this, [delta]);
    updateEditMode(window.location.href);
    var listeners =
      window.__SPFxExtensions.Utils.historyEventListeners?.filter(
        (l) => l.eventType === "onHistoryGo"
      ) || [];
    listeners.forEach((l) => {
      l.callBack(delta);
    });
  }
  window.history.go = _go;
}

function updateEditMode(url: string | URL | undefined) {
  let isEditMode = false;

  if (typeof url === "undefined") {
    isEditMode = window.location.href.indexOf("Mode=Edit") !== -1;
  } else if (typeof url === "string") {
    isEditMode = url.indexOf("Mode=Edit") !== -1;
  } else {
    isEditMode = url.search.indexOf("Mode=Edit") !== -1;
  }
  window.__SPFxExtensions.Utils.displayMode = isEditMode
    ? "Edit"
    : "Read";
}

function removeHistoryListener(id: string) {
  if (!window.__SPFxExtensions.Utils.historyEventListeners) {
    return;
  }

  const elId =
    window.__SPFxExtensions.Utils.historyEventListeners.findIndex(
      (l) => l.id === id
    );

  if (elId > -1) {
    window.__SPFxExtensions.Utils.historyEventListeners?.splice(
      elId,
      1
    );
  }
}

export function initHistoryInterception() {
  if (window.__SPFxExtensions.Utils.historyInterceptionInited) {
    return;
  }
  window.__SPFxExtensions.Utils.historyInterceptionInited = true;

  window.__SPFxExtensions.Utils.originalPushState =
    window.history.pushState;
  window.__SPFxExtensions.Utils.originalReplaceState =
    window.history.replaceState;
  window.__SPFxExtensions.Utils.originalHistoryBack =
    window.history.back;
  window.__SPFxExtensions.Utils.originalHistoryForward =
    window.history.forward;
  window.__SPFxExtensions.Utils.originalHistoryGo =
    window.history.go;

  window.__SPFxExtensions.Utils.historyEventListeners = [];
  window.__SPFxExtensions.Utils.removeHistoryEventListener =
    removeHistoryListener;
  window.__SPFxExtensions.Utils.addHistoryEventListener = (
    eventType,
    callBack
  ) => {
    const listenerId = window.crypto.randomUUID();
    window.__SPFxExtensions.Utils.historyEventListeners?.push({
      id: listenerId,
      eventType,
      callBack,
    });
    return () => {
      window.__SPFxExtensions.Utils.removeHistoryEventListener?.(
        listenerId
      );
    };
  };

  interceptHistoryReplaceState();
  interceptHistoryPushState();
  interceptHistoryForward();
  interceptHistoryBack();
  interceptHistoryGo();
}
