import type { ConfigurationListBaseData } from "../../models/configurationList";
import { CONFIGURATION_LIST_NAME, SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getDefaultSettings } from "../utility/defaultConfig";
import { getAppCatalogDigest, SPFX_EXTENSIONS_SITE_URL } from "./appCatalogService";
import { ensureSPFxWeb } from "./configurationWebService";
import {
  addOrUpdateExtensionConfigs,
  getAllExtensionConfigFromDB,
  getRuntimeCacheItem,
} from "./coreIdbService";
import { logGenericCoreError, logGenericCoreInfo } from "./loggingService";
import { ensureConfiguratorPage } from "./pageService";
import { ensureAppWhiteList } from "./whiteListService";

/**
 * Overlays the persisted/API settings on top of the complete default set so every known
 * setting always resolves (the API/cache value wins; defaults only fill the gaps).
 */
function mergeSettings(items: ConfigurationListBaseData[]): ConfigurationListBaseData[] {
  const byTitle = new Map<ConfigurationListBaseData["Title"], ConfigurationListBaseData>();
  for (const def of getDefaultSettings(SPFX_EXTENSIONS_SITE_URL)) {
    byTitle.set(def.Title, def);
  }
  for (const item of items) {
    byTitle.set(item.Title, item);
  }
  return [...byTitle.values()];
}

// Elects a single tab per browser to ensure/create the SharePoint list and seed
// the shared cache, so concurrent tabs do not race the check-then-create logic.
const CONFIG_BOOTSTRAP_LOCK = "spfxext-config-bootstrap";

let configurationListDataPromise: Promise<ConfigurationListBaseData[]> | undefined;

async function ensureConfigurationListDataField() {
  // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')/fields
  const fieldsUrl = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields`;
  try {
    const req = await fetch(fieldsUrl, {
      headers: {
        Accept: "application/json;odata=verbose",
      },
    });
    if (req.status === 200) {
      const data = await req.json();
      const fields = data.d.results;
      const fieldNames = fields.map((f: any) => f.InternalName);
      const titleField = fields.find((f: any) => f.InternalName === "Title");
      if (!titleField) {
        logGenericCoreError("Title field not found.");
        return;
      }
      if (!titleField.EnforceUniqueValues) {
        const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);

        // Update the Title field
        const updateFieldReq = await fetch(
          `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/fields('${titleField.Id}')`,
          {
            method: "POST",
            headers: {
              Accept: "application/json;odata=verbose",
              "Content-Type": "application/json;odata=verbose",
              "X-RequestDigest": appCatalogDigest,
              "X-HTTP-Method": "MERGE",
              "If-Match": "*",
            },
            body: JSON.stringify({
              __metadata: {
                type: "SP.Field",
              },
              Indexed: true,
              EnforceUniqueValues: true,
            }),
          }
        );
        if (updateFieldReq.status === 204) {
          logGenericCoreInfo("Title field updated successfully.");
        } else {
          logGenericCoreError("Unable to update Title field.");
        }
      }
      if (!fieldNames.includes("Data")) {
        const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);

        // Add the Data field
        const addFieldReq = await fetch(fieldsUrl, {
          method: "POST",
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": appCatalogDigest,
          },
          body: JSON.stringify({
            __metadata: {
              type: "SP.Field",
            },
            Title: "Data",
            FieldTypeKind: 2,
            Required: true,
          }),
        });
        if (addFieldReq.status === 201) {
          logGenericCoreInfo("Data field added successfully.");
        } else {
          logGenericCoreError("Unable to add Data field.");
        }
      }
    }
  } catch (err) {
    logGenericCoreError("Error while ensuring configuration list data fields.", err);
  }
}

async function ensureConfigurationList() {
  // /sites/appcatalog/_api/web/lists/GetByTitle('SPFxExtensionsConfiguration')
  let newList = false;
  try {
    const req = await fetch(
      `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')`
    );
    newList = req.status === 404;
    if (newList) {
      const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);

      logGenericCoreInfo("Creating configuration list.");
      // Create the list
      const createReq = await fetch(`${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists`, {
        method: "POST",
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-RequestDigest": appCatalogDigest,
        },
        body: JSON.stringify({
          __metadata: {
            type: "SP.List",
          },
          // AllowContentTypes: false,
          // ContentTypesEnabled: false,
          BaseTemplate: 100,
          Title: "SPFxExtensionsConfiguration",
          Description: "Configuration list for SPFxExtensions",
        }),
      });
      if (createReq.status === 201) {
        logGenericCoreInfo("Configuration list created successfully.");
      } else {
        logGenericCoreError("Unable to create configuration list.");
      }
    }
    await ensureConfigurationListDataField();
  } catch (err) {
    logGenericCoreError("Error while ensuring configuration list.", err);
  }
  return newList;
}

export async function getConfigurationListItemsFromAPI() {
  const requestUrl = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items?$select=Title,Data`;
  const config = {
    headers: {
      Accept: "application/json;odata=verbose",
    },
  };
  const req = await fetch(requestUrl, {
    ...config,
  });
  if (req.status !== 200) {
    throw new Error(`Unable to fetch configuration list items (status ${req.status}).`);
  }
  const data = await req.json();
  return data.d.results as ConfigurationListBaseData[];
}

/**
 * Cheap change signal: the list's `LastItemModifiedDate` changes whenever any
 * item is added/edited/removed. Polling this avoids pulling all items every time.
 */
export async function getConfigChangeToken(): Promise<string> {
  //SPO caches forcibly, so we need to add time to ensure that data is actual.
  const requestUrl = `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')?$select=LastItemModifiedDate&v=${Date.now()}`;
  const req = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json;odata=nometadata",
      // Accept: "application/json;odata.metadata=minimal",
      // "Odata-Version": "4.0",
    },
  });
  if (req.status !== 200) {
    logGenericCoreError("Unable to fetch configuration list change token.");
    return "";
  }
  const data = await req.json();
  return (data?.LastItemModifiedDate as string) ?? "";
}

async function createDefaultListItems() {
  const appCatalogDigest = await getAppCatalogDigest(SPFX_EXTENSIONS_DATA_SITE);

  for (const item of getDefaultSettings(SPFX_EXTENSIONS_SITE_URL)) {
    const addReq = await fetch(
      `${SPFX_EXTENSIONS_SITE_URL}/_api/web/lists/GetByTitle('${CONFIGURATION_LIST_NAME}')/items`,
      {
        method: "POST",
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-RequestDigest": appCatalogDigest,
        },
        body: JSON.stringify({
          __metadata: {
            type: "SP.Data.SPFxExtensionsConfigurationListItem",
          },
          ...item,
        }),
      }
    );
    if (addReq.status === 201) {
      logGenericCoreInfo(`Item ${item.Title} added successfully.`);
    } else {
      logGenericCoreError(`Unable to add item ${item.Title}.`);
    }
  }
}

export function getConfigurationListData(fresh = false) {
  if (fresh) {
    return getConfigurationListItemsFromAPI().then(mergeSettings);
  }
  // Memoized for the page's lifetime; the memo is reset explicitly via `invalidateConfigMemo`
  // / `commitConfigItems` (after provisioning, or when the watcher detects a change).
  if (!configurationListDataPromise) {
    configurationListDataPromise = getConfigurationListDataCached();
  }
  return configurationListDataPromise;
}

/**
 * Clears the in-memory memo so the next `getConfigurationListData()` re-reads IndexedDB.
 * Used by non-leader tabs after the leader commits new config to the shared cache.
 */
export function invalidateConfigMemo() {
  configurationListDataPromise = undefined;
}

/**
 * Writes freshly fetched items to IndexedDB and refreshes the in-memory memo so
 * `getCoreConfig()` serves the new values without a page reload.
 */
export async function commitConfigItems(items: ConfigurationListBaseData[]) {
  await addOrUpdateExtensionConfigs(items, 240);
  configurationListDataPromise = Promise.resolve(mergeSettings(items));
}

async function getConfigurationListDataCached() {
  const cached = await getAllExtensionConfigFromDB();
  if (cached.length > 0) {
    return mergeSettings(cached);
  }
  // Cold cache: read the list directly. This throws when the data site / list is missing
  // (i.e. not installed); `ensureCoreConfiguration` catches that and provisions.
  const items = await getConfigurationListItemsFromAPI();
  await addOrUpdateExtensionConfigs(items, 240);
  return mergeSettings(items);
}

/**
 * Provisions every piece of SharePoint infrastructure the extension needs, in dependency
 * order, under a single cross-tab lock so concurrent tabs don't race the create. Called by
 * `ensureCoreConfiguration` only when the optimistic config read fails (not installed).
 * The installer is necessarily an admin, so this is effectively an admin-only path; for a
 * non-admin on a genuinely un-provisioned tenant the ensures no-op and later reads hard-fail.
 */
export async function provisionInstall() {
  await window.navigator.locks.request(CONFIG_BOOTSTRAP_LOCK, { mode: "exclusive" }, async () => {
    // Another tab may have provisioned while we queued; its ensure-results are shared.
    const provisioned = await getRuntimeCacheItem("SPFxDataSite");
    if (provisioned?.Data) {
      return;
    }
    await ensureSPFxWeb();
    const isNewList = await ensureConfigurationList();
    if (isNewList) {
      await createDefaultListItems();
    }
    await ensureAppWhiteList();
    await ensureConfiguratorPage();
  });
  // Clear the memo so the next `getConfigurationListData()` re-reads the now-provisioned list.
  invalidateConfigMemo();
}
