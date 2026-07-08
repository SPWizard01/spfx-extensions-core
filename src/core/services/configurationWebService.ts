import type { ApiCallResult } from "../../configurator/models/apiCallResult";
import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlFromAPI } from "./appCatalogService";
import { addOrUpdateRuntimeCache, getRuntimeCacheItem } from "./coreIdbService";
import { logGenericCoreError } from "./loggingService";

async function createWeb(webUrl: string) {
  const appCatalog = await getAppCatalogUrlFromAPI();
  const appCatalogDigest = await getAppCatalogDigest();
  const response = await fetch(`${appCatalog}/_api/web/webs/add`, {
    method: "POST",
    headers: {
      Accept: "application/json;odata=nometadata",
      "Content-Type": "application/json",
      "X-RequestDigest": appCatalogDigest,
    },
    body: JSON.stringify({
      parameters: {
        Description: "Site that stores SPFxExtensions Data and global apps",
        Language: 1033,
        Title: "SPFxExtensions Data",
        Url: webUrl,
        UseSamePermissionsAsParentSite: true,
        WebTemplate: "STS",
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create SPFxExtensionsData web in ${appCatalog}`);
  }
  const data = await response.json();
  return data;
}

async function getWebData(): Promise<ApiCallResult<any>> {
  const appCatalog = await getAppCatalogUrlFromAPI();
  const appCatalogDigest = await getAppCatalogDigest();
  const response = await fetch(`${appCatalog}/${SPFX_EXTENSIONS_DATA_SITE}/_api/web`, {
    method: "GET",
    headers: {
      Accept: "application/json;odata=nometadata",
      "X-RequestDigest": appCatalogDigest,
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      return {
        data: undefined,
        isError: false,
        error: "",
        warnings: [`SPFxExtensionsData web not found in ${appCatalog}`],
      };
    }
    logGenericCoreError(
      `Failed to fetch data from ${appCatalog}/${SPFX_EXTENSIONS_DATA_SITE}/_api/web`
    );
    return {
      data: undefined,
      isError: true,
      error: `Failed to fetch data from ${appCatalog}/${SPFX_EXTENSIONS_DATA_SITE}/_api/web`,
      warnings: [],
    };
  }
  const data = await response.json();
  return {
    data: data,
    isError: false,
    error: "",
    warnings: [],
  };
}

async function getWebDataCached() {
  const appCatalogWebs = await getRuntimeCacheItem("SPFxDataSite");
  return appCatalogWebs?.Data;
}
let ensureWebDataPromise: Promise<any> | undefined;
export function ensureSPFxWeb() {
  if (ensureWebDataPromise) {
    return ensureWebDataPromise;
  }
  ensureWebDataPromise = ensureWebDataInternal();
  return ensureWebDataPromise;
}
async function ensureWebDataInternal() {
  const webData = await getWebDataCached();
  if (!webData) {
    const apiResponse = await getWebData();
    if (!apiResponse.isError && !apiResponse.data) {
      const result = await createWeb(SPFX_EXTENSIONS_DATA_SITE);
      apiResponse.data = result;
    }
    await addOrUpdateRuntimeCache({ Title: "SPFxDataSite", Data: apiResponse.data }, 240);
    return apiResponse.data;
  }
  return webData;
}
