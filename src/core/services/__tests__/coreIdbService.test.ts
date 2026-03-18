import { deleteDB } from "idb";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks
const warnMock = vi.fn();
const errorMock = vi.fn();
const cleanMock = vi.fn().mockResolvedValue(void 0);
vi.mock("../loggingService", () => ({
  logGenericCoreWarning: warnMock,
  logGenericCoreError: errorMock,
}));
vi.mock("../browserCache", () => ({ cleanStorageCache: cleanMock }));

// Avoid top-level awaits and circular imports from appCatalogService/coreConfigService
vi.mock("../appCatalogService", () => ({
  APP_CATALOG_URL: "/sites/appcatalog",
  SPFX_EXTENSIONS_SITE_URL: "/sites/appcatalog/SPFxExtensionsData",
  getAppCatalogUrlCached: async () => "/sites/appcatalog",
}));

beforeEach(async () => {
  vi.resetModules();
  warnMock.mockReset();
  errorMock.mockReset();
  cleanMock.mockReset();
  // Ensure a clean db per test; DB name is derived from DEBUG_KEYS in the module
  try {
    await deleteDB("SPFXEXT_COREDB");
  } catch {}
});

describe("core/services/coreIdbService - config store", () => {
  it("addOrUpdateExtensionConfig and retrieval, eviction of expired", async () => {
    const {
      addOrUpdateExtensionConfig,
      getExtensionConfigFromDB,
      getAllExtensionConfigFromDB,
      spfxExtensionsCoreDB,
    } = await import("../coreIdbService");

    // Add a valid config (expires in future by default)
    await addOrUpdateExtensionConfig({ Title: "Cfg1" } as any, 60);
    const single = await getExtensionConfigFromDB("Cfg1");
    expect(single?.Title).toBe("Cfg1");

    // Seed an expired item directly, then getAll should evict it and log
    const expired = new Date(0).toISOString();
    await spfxExtensionsCoreDB.put(
      "SPFxExtensionConfig" as any,
      { Title: "Old", expires: expired } as any
    );
    const all = await getAllExtensionConfigFromDB();
    expect(Array.isArray(all)).toBe(true);
    expect(warnMock).toHaveBeenCalledWith("Evicted 1 items from SPFxExtensionConfig cache.");
  });

  it("addOrUpdateExtensionConfigs (bulk) writes multiple items with expiry", async () => {
    const { addOrUpdateExtensionConfigs, getAllExtensionConfigFromDB } = await import(
      "../coreIdbService"
    );

    await addOrUpdateExtensionConfigs([{ Title: "CfgA" } as any, { Title: "CfgB" } as any], 15);
    const all = await getAllExtensionConfigFromDB();
    const titles = all.map((a: any) => a.Title);
    expect(titles).toContain("CfgA");
    expect(titles).toContain("CfgB");
    // Has an expires field
    expect(typeof (all[0] as any).expires).toBe("string");
  });
});

describe("core/services/coreIdbService - allowed apps & hub data", () => {
  it("add/get allowed apps and hub data", async () => {
    const {
      addOrUpdateAllowedAppsToCache,
      getAllAllowedAppsFromDB,
      addOrUpdateHubDataToCache,
      getHubData,
    } = await import("../coreIdbService");

    await addOrUpdateAllowedAppsToCache([{ Id: 1 } as any, { Id: 2 } as any], 5);
    const apps = await getAllAllowedAppsFromDB();
    expect(apps.map((a: any) => a.Id)).toEqual([1, 2]);

    await addOrUpdateHubDataToCache({ SiteId: "S1" } as any, 10);
    const hub = await getHubData("S1");
    expect(hub?.SiteId).toBe("S1");
    expect(typeof hub?.expires).toBe("string");
  });
});

describe("core/services/coreIdbService - manifest caches & debug bypass", () => {
  it("evicts AppFolder manifest on hash mismatch and cleans storage", async () => {
    const { spfxExtensionsCoreDB, evictManifestTXTCache } = await import("../coreIdbService");

    const url = "/sites/demo/spfxextensions/manifest.txt";
    await spfxExtensionsCoreDB.put(
      "AppFolderManifestCache" as any,
      {
        url,
        hash: "A",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );

    await evictManifestTXTCache({ url, hash: "B" } as any);
    const remaining = await spfxExtensionsCoreDB.get("AppFolderManifestCache" as any, url);
    expect(remaining).toBeUndefined();
    expect(cleanMock).toHaveBeenCalledWith(["/sites/demo/spfxextensions"], false);
  });

  it("evicts AppCollection manifest on hash mismatch and cleans storage", async () => {
    const { spfxExtensionsCoreDB, evictAppsTXTCache } = await import("../coreIdbService");

    const url = "/sites/demo/spfxextensions/collectionconfig.txt";
    await spfxExtensionsCoreDB.put(
      "AppCollectionManifestCache" as any,
      {
        url,
        hash: "A",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );

    await evictAppsTXTCache({ url, hash: "B" } as any);
    const remaining = await spfxExtensionsCoreDB.get("AppCollectionManifestCache" as any, url);
    expect(remaining).toBeUndefined();
    expect(cleanMock).toHaveBeenCalledWith([url], false);
  });

  it("getManifestTXTFromCache returns undefined when isInDebug=true", async () => {
    // Re-mock debug to enable debug mode for this import
    vi.doMock("../../../utilities/debug", () => ({
      DEBUG_KEYS: { SPFXEXT: "SPFXEXT_", SPFXEXT_CORE: "SPFXEXT" },
      isInDebug: true,
    }));

    const { spfxExtensionsCoreDB, getManifestTXTFromCache } = await import("../coreIdbService");

    const url = "/sites/demo/spfxextensions/manifest.txt";
    await spfxExtensionsCoreDB.put(
      "AppFolderManifestCache" as any,
      {
        url,
        hash: "Z",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );

    const result = await getManifestTXTFromCache(url);
    expect(result).toBeUndefined();
  });

  it("setOrUpdateManifestTXT updates when hash differs", async () => {
    const { spfxExtensionsCoreDB, setOrUpdateManifestTXT } = await import("../coreIdbService");

    const url = "/sites/demo/spfxextensions/manifest.txt";
    // Seed with A
    await spfxExtensionsCoreDB.put(
      "AppFolderManifestCache" as any,
      {
        url,
        hash: "A",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );

    await setOrUpdateManifestTXT({ url, hash: "B" } as any, 10);
    const updated = await spfxExtensionsCoreDB.get("AppFolderManifestCache" as any, url);
    expect(updated?.hash).toBe("B");
  });

  it("getAppCollectionTXTFromCache returns undefined in debug mode", async () => {
    vi.doMock("../../../utilities/debug", () => ({
      DEBUG_KEYS: { SPFXEXT: "SPFXEXT_", SPFXEXT_CORE: "SPFXEXT" },
      isInDebug: true,
    }));
    const { spfxExtensionsCoreDB, getAppCollectionTXTFromCache } = await import(
      "../coreIdbService"
    );

    const url = "/sites/demo/spfxextensions/collectionconfig.txt";
    await spfxExtensionsCoreDB.put(
      "AppCollectionManifestCache" as any,
      {
        url,
        hash: "H",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );

    const res = await getAppCollectionTXTFromCache(url);
    expect(res).toBeUndefined();
  });

  it("setOrUpdateAppCollectionTXT is a no-op when hash is equal (not in debug)", async () => {
    const { spfxExtensionsCoreDB, setOrUpdateAppCollectionTXT } = await import("../coreIdbService");

    const url = "/sites/demo/spfxextensions/collectionconfig.txt";
    const expires = new Date(Date.now() + 60_000).toISOString();
    await spfxExtensionsCoreDB.put(
      "AppCollectionManifestCache" as any,
      { url, hash: "S", expires } as any
    );

    await setOrUpdateAppCollectionTXT({ url, hash: "S" } as any, 30);
    const item = await spfxExtensionsCoreDB.get("AppCollectionManifestCache" as any, url);
    expect(item?.hash).toBe("S");
    // Expiry may be updated as part of eviction touch; main check is no new write of different hash
    expect(typeof item?.expires).toBe("string");
  });

  it("getManifestTXTFromCache returns cached item when not in debug", async () => {
    // Ensure debug=false for this import
    vi.doMock("../../../utilities/debug", () => ({
      DEBUG_KEYS: { SPFXEXT: "SPFXEXT_", SPFXEXT_CORE: "SPFXEXT" },
      isInDebug: false,
    }));
    const { spfxExtensionsCoreDB, getManifestTXTFromCache } = await import("../coreIdbService");
    const url = "/sites/demo/spfxextensions/manifest.txt";
    await spfxExtensionsCoreDB.put(
      "AppFolderManifestCache" as any,
      {
        url,
        hash: "G",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );
    const res = await getManifestTXTFromCache(url);
    expect(res?.hash).toBe("G");
  });

  it("getAppCollectionTXTFromCache returns cached item when not in debug", async () => {
    vi.doMock("../../../utilities/debug", () => ({
      DEBUG_KEYS: { SPFXEXT: "SPFXEXT_", SPFXEXT_CORE: "SPFXEXT" },
      isInDebug: false,
    }));
    const { spfxExtensionsCoreDB, getAppCollectionTXTFromCache } = await import(
      "../coreIdbService"
    );
    const url = "/sites/demo/spfxextensions/collectionconfig.txt";
    await spfxExtensionsCoreDB.put(
      "AppCollectionManifestCache" as any,
      {
        url,
        hash: "H",
        expires: new Date(Date.now() + 60_000).toISOString(),
      } as any
    );
    const res = await getAppCollectionTXTFromCache(url);
    expect(res?.hash).toBe("H");
  });

  it("evictManifestTXTCache without item evicts expired entries", async () => {
    const { spfxExtensionsCoreDB, evictManifestTXTCache } = await import("../coreIdbService");
    const expired = new Date(0).toISOString();
    await spfxExtensionsCoreDB.put(
      "AppFolderManifestCache" as any,
      { url: "/u1/manifest.txt", hash: "E1", expires: expired } as any
    );
    await evictManifestTXTCache();
    const deleted = await spfxExtensionsCoreDB.get(
      "AppFolderManifestCache" as any,
      "/u1/manifest.txt"
    );
    expect(deleted).toBeUndefined();
    expect(warnMock).toHaveBeenCalledWith("Evicted 1 items from AppFolderManifestCache cache.");
  });

  it("evictAppsTXTCache without item evicts expired entries", async () => {
    const { spfxExtensionsCoreDB, evictAppsTXTCache } = await import("../coreIdbService");
    const expired = new Date(0).toISOString();
    await spfxExtensionsCoreDB.put(
      "AppCollectionManifestCache" as any,
      { url: "/u1/collectionconfig.txt", hash: "E2", expires: expired } as any
    );
    await evictAppsTXTCache();
    const deleted = await spfxExtensionsCoreDB.get(
      "AppCollectionManifestCache" as any,
      "/u1/collectionconfig.txt"
    );
    expect(deleted).toBeUndefined();
    expect(warnMock).toHaveBeenCalledWith("Evicted 1 items from AppCollectionManifestCache cache.");
  });
});

describe("core/services/coreIdbService - eviction helpers for stores", () => {
  it("evictAllowedAppsCache and evictHubDataCache remove expired entries", async () => {
    const { spfxExtensionsCoreDB, evictAllowedAppsCache, evictHubDataCache } = await import(
      "../coreIdbService"
    );
    const expired = new Date(0).toISOString();
    await spfxExtensionsCoreDB.put("AllowedApps" as any, { Id: 1, expires: expired } as any);
    await spfxExtensionsCoreDB.put("HubSiteData" as any, { SiteId: "S1", expires: expired } as any);

    const appsEvicted = await evictAllowedAppsCache();
    const hubEvicted = await evictHubDataCache();
    expect(appsEvicted).toBe(1);
    expect(hubEvicted).toBe(1);
    expect(warnMock).toHaveBeenCalledWith("Evicted 1 items from AllowedApps cache.");
    expect(warnMock).toHaveBeenCalledWith("Evicted 1 items from HubSiteData cache.");
  });
});
