import type { HistoryEventDetails } from "../../models/customEvents";

interface NewStateDetails {
  newState?: any,
  newUrl?: string | URL
  delta?: number
}
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;
const originalHistoryBack = window.history.back;
const originalHistoryForward = window.history.forward;
const originalHistoryGo = window.history.go;

function getCurrentState() {
  const currentState = window.history.state;
  const previousUrl = window.location.href;
  return { currentState, previousUrl };
}

function dispatchEvent(eventName: string, newState: NewStateDetails) {
  const detail: HistoryEventDetails = {
    ...getCurrentState(),
    ...newState,
  };
  const evt = new CustomEvent<HistoryEventDetails>(eventName, { detail });
  window.dispatchEvent(evt);
}

function interceptHistoryPushState() {
  function _pushState(
    this: any,
    newState: any,
    unused: string,
    newUrl?: string | URL
  ) {
    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    originalPushState.call(this, newState, unused, newUrl);
    dispatchEvent("historyPush", { newState, newUrl });
  }
  window.history.pushState = _pushState;
}

function interceptHistoryReplaceState() {
  function _replaceState(
    this: any,
    newState: any,
    unused: string,
    newUrl?: string | URL
  ) {
    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    originalReplaceState.call(this, newState, unused, newUrl);
    dispatchEvent("historyReplace", { newState, newUrl });
  }
  window.history.replaceState = _replaceState;
}

function interceptHistoryBack() {
  function _goBack(this: any) {

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    originalHistoryBack.call(this);
    dispatchEvent("historyBack", {});
  }
  window.history.back = _goBack;
}

function interceptHistoryForward() {
  function _goForward(this: any) {

    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    originalHistoryForward.call(this);
    dispatchEvent("historyForward", {});
  }
  window.history.forward = _goForward;
}

function interceptHistoryGo() {
  function _go(this: any, delta: number | undefined) {
    // Call the original function with the provided arguments
    // This context is necessary for the context of the history change
    originalHistoryGo.call(this, delta);
    dispatchEvent("historyGo", { delta });
  }
  window.history.go = _go;
}

let historyInterceptionInited = false;
export function initHistoryInterception() {
  if (historyInterceptionInited) {
    return;
  }
  historyInterceptionInited = true;

  interceptHistoryReplaceState();
  interceptHistoryPushState();
  interceptHistoryForward();
  interceptHistoryBack();
  interceptHistoryGo();
}
