import type { ConfigChangeEventDetails } from "../../models/customEvents";
import { getContentHash } from "../../utilities/digest";
import { DEBUG_KEY_APP_PREFIX } from "../../utilities/runtimeConstants";
import {
  commitConfigItems,
  getConfigChangeToken,
  getConfigurationListData,
  getConfigurationListItemsFromAPI,
  invalidateConfigMemo,
} from "./configurationListService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";

const CORE_CONFIG_CHECK_INTERVAL = 300000; // 5 minutes
const MAX_START_JITTER = 30000; // 0-30s so the whole org does not stampede the list at once
const CONFIG_POLL_LOCK = "spfxext-config-poll";
const CONFIG_TOKEN_KEY = `${DEBUG_KEY_APP_PREFIX}CONFIG_TOKEN`;
const CONFIG_HASH_KEY = `${DEBUG_KEY_APP_PREFIX}CONFIG_HASH`;

let configWatchStarted = false;

function dispatchConfigChange(current: ConfigChangeEventDetails["current"]) {
  const evt = new CustomEvent<ConfigChangeEventDetails>("configChange", { detail: { current } });
  window.dispatchEvent(evt);
}

/**
 * Leader-only: poll the cheap change token and, only when the settings actually
 * changed, commit them to the shared cache and notify this (and every other) tab.
 */
async function performConfigCheck() {
  // Only the visible leader tab should reach out to SharePoint.
  if (document.visibilityState !== "visible") return;
  try {
    const token = await getConfigChangeToken();
    if (!token) return;
    const storedToken = window.localStorage.getItem(CONFIG_TOKEN_KEY);
    if (token === storedToken) return;

    const items = await getConfigurationListItemsFromAPI();
    const hash = await getContentHash(JSON.stringify(items));
    const storedHash = window.localStorage.getItem(CONFIG_HASH_KEY);
    const isBaseline = storedHash === null;

    // Record the token even when content is unchanged so we don't refetch next tick.
    window.localStorage.setItem(CONFIG_TOKEN_KEY, token);
    if (hash === storedHash) return; // list was touched but the settings are identical

    // Commit to the shared IndexedDB before signalling other tabs so they read fresh data.
    await commitConfigItems(items);
    window.localStorage.setItem(CONFIG_HASH_KEY, hash);
    // The first run only seeds the baseline; there is nothing to react to yet.
    if (!isBaseline) {
      dispatchConfigChange(items);
    }
  } catch (e) {
    logGenericCoreError("Error checking for configuration updates", e);
  }
}

/**
 * Non-leader tabs: the leader has already written the new config to the shared
 * cache and bumped the hash key. Drop our memo, re-read the shared cache and
 * notify the apps running in this tab.
 */
async function onConfigStorageEvent(e: StorageEvent) {
  // React only to a genuine change of the hash key (skip first-time seeding / no-ops).
  if (e.key !== CONFIG_HASH_KEY || !e.newValue || !e.oldValue || e.newValue === e.oldValue) {
    return;
  }
  invalidateConfigMemo();
  const items = await getConfigurationListData();
  dispatchConfigChange(items);
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    performConfigCheck();
  }
}

function startLeaderPolling() {
  logGenericCoreInfo("This tab is the global configuration poll leader.");
  document.addEventListener("visibilitychange", onVisibilityChange);
  // Jitter the first check so a whole organisation does not hit the list at once.
  const jitter = Math.floor(Math.random() * MAX_START_JITTER);
  window.setTimeout(() => {
    performConfigCheck();
    window.setInterval(performConfigCheck, CORE_CONFIG_CHECK_INTERVAL);
  }, jitter);
}

/**
 * Registers global-settings change polling. Safe to call once per page: a single
 * tab per browser is elected leader (via the Web Locks API) and does the polling,
 * while every tab listens for changes the leader commits to shared storage.
 */
export function registerConfigWatcher() {
  if (configWatchStarted) return;
  configWatchStarted = true;
  // Every tab reacts to changes the leader commits to shared storage.
  window.addEventListener("storage", onConfigStorageEvent);
  // Elect one leader across all same-origin tabs; only the winner polls SharePoint.
  window.navigator.locks.request(CONFIG_POLL_LOCK, { mode: "exclusive" }, () => {
    startLeaderPolling();
    // Never resolves: hold the lock for this tab's lifetime so it stays the leader.
    return new Promise<void>(() => {});
  });
}
