import { beforeEach, describe, expect, it, vi } from "vitest";

async function importServiceWithMocks(opts?: {
  evicted?: boolean;
  cached?: any[];
  apiList?: any[];
  coreConfig?: Array<{ Title: string; Data: string }>;
  debugUrl?: string | null;
  fetchPages?: Array<{ results?: any[]; next?: string; error?: any }>;
}) {
  vi.resetModules();

  const {
    evicted = false,
    cached = [],
    apiList = [],
    coreConfig = [{ Title: "EnableAppWhiteList", Data: "true" }],
    debugUrl = null,
    fetchPages,
  } = opts || {};

  // constants and app catalog URL
  vi.doMock("../../../utilities/constants", () => ({
    ALLOWEDAPPSLIST_NAME: "SPFxExtensionsWhiteList",
    SPFX_EXTENSIONS_DATA_SITE: "SPFxExtensionsData",
  }));
  vi.doMock("../appCatalogService", () => ({
    SPFX_EXTENSIONS_SITE_URL: "https://contoso.sharepoint.com/sites/appcatalog/SPFxExtensionsData",
  }));

  // core idb cache API
  vi.doMock("../coreIdbService", () => ({
    evictAllowedAppsCache: async () => evicted,
    getAllAllowedAppsFromDB: async () => cached,
    addOrUpdateAllowedAppsToCache: vi.fn(),
  }));

  // coreConfig
  vi.doMock("../coreConfigService", () => ({
    getCoreConfig: async () => coreConfig,
  }));

  // logging
  const warn = vi.fn();
  const info = vi.fn();
  const error = vi.fn();
  vi.doMock("../loggingService", () => ({
    logGenericCoreWarning: warn,
    logGenericCoreInfo: info,
    logGenericCoreError: error,
  }));

  // debug
  vi.doMock("../../../utilities/debug", () => ({
    DEBUG_KEYS: { SPFXEXT: "SPFXEXT_" },
    isFileInDebug: (u: URL) => (debugUrl ? u.href.includes(debugUrl) : false),
  }));

  // fetch mock for list enumerate
  const fetchMock = vi.fn();
  // assign global fetch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = fetchMock;
  if (fetchPages) {
    fetchMock.mockImplementation(async (url: string) => {
      // Consume first page
      const page = fetchPages.shift()!;
      const body = page.error
        ? { error: page.error }
        : {
            d: {
              results: page.results ?? [],
              __next: page.next,
            },
          };
      return {
        json: async () => body,
      } as Response;
    });
  } else {
    fetchMock.mockResolvedValue({
      json: async () => ({ d: { results: apiList, __next: undefined } }),
    } as any);
  }

  const mod = await import("../allowedAppsService");
  return { mod, logs: { warn, info, error }, fetchMock };
}

describe("allowedAppsService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("uses cached data when present and nothing evicted (wildcard allows)", async () => {
    const cached = [{ Id: 1, Title: "A", EntryPointUrl: "*" }];
    const { mod } = await importServiceWithMocks({ cached, evicted: false });
    const url = new URL("https://contoso/site/app.js");
    await expect(mod.isFileAllowedToRun(url, "manifest.json")).resolves.toBe(true);
  });

  it("logs info and refreshes when cache mismatch (evicted=true but cached>0)", async () => {
    const { mod, logs } = await importServiceWithMocks({
      cached: [{ Id: 1, Title: "C", EntryPointUrl: "/a" }],
      evicted: true,
      apiList: [],
    });
    // Import triggers cache check; calling isFileAllowedToRun ensures module was loaded
    const url = new URL("https://contoso/not-allowed/app.js");
    await mod.isFileAllowedToRun(url, "manifest.json");
    expect(logs.info).toHaveBeenCalled();
  });

  it("getAllowedFilesFromApi returns wildcard when whitelist disabled", async () => {
    const { mod } = await importServiceWithMocks({
      coreConfig: [{ Title: "EnableAppWhiteList", Data: "false" }],
    });
    const list = await mod.getAllowedFilesFromApi();
    expect(list).toEqual(expect.arrayContaining([expect.objectContaining({ EntryPointUrl: "*" })]));
  });

  it("getAllowedFilesFromApi paginates until __next is absent", async () => {
    const { mod, fetchMock } = await importServiceWithMocks({
      // Ensure import-time cache path does not fetch
      cached: [{ Id: 0, Title: "Cached", EntryPointUrl: "/cached" }],
      evicted: false,
      fetchPages: [
        { results: [{ Id: 1, EntryPointUrl: "/a" }], next: "page2" },
        { results: [{ Id: 2, EntryPointUrl: "/b" }], next: undefined },
      ],
    });
    const list = await mod.getAllowedFilesFromApi(true);
    expect(list.map((x: any) => x.Id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("getAllowedFilesFromApi throws when API returns error payload", async () => {
    const { mod } = await importServiceWithMocks({
      fetchPages: [{ error: { code: "500", message: "boom" } }],
    });
    await expect(mod.getAllowedFilesFromApi(true)).rejects.toThrow();
  });

  it("isFileAllowedToRun returns true when wildcard '*' present (whitelist disabled)", async () => {
    const { mod } = await importServiceWithMocks({
      coreConfig: [{ Title: "EnableAppWhiteList", Data: "false" }],
    });
    const url = new URL("https://contoso.sharepoint.com/sites/site/SiteAssets/app.js");
    await expect(mod.isFileAllowedToRun(url, "manifest.json", true)).resolves.toBe(true);
  });

  it("isFileAllowedToRun returns true when exact origin+path match (from API)", async () => {
    const url = new URL("https://contoso.sharepoint.com/sites/site/SiteAssets/app.js");
    const { mod } = await importServiceWithMocks({ apiList: [{ EntryPointUrl: url.href }] });
    await expect(mod.isFileAllowedToRun(url, "manifest.json", true)).resolves.toBe(true);
  });

  it("isFileAllowedToRun logs error for invalid allowed URL entries and returns false", async () => {
    const { mod, logs } = await importServiceWithMocks({
      cached: [{ EntryPointUrl: "not a url" }],
      evicted: false,
    });
    const url = new URL("https://contoso.sharepoint.com/sites/site/SiteAssets/app.js");
    const res = await mod.isFileAllowedToRun(url, "manifest.json");
    expect(res).toBe(false);
    expect(logs.error).toHaveBeenCalled();
  });

  it("isFileAllowedToRun returns true when URL is in debug", async () => {
    const { mod } = await importServiceWithMocks({ debugUrl: "debug" });
    const url = new URL("https://contoso/debug/app.js");
    await expect(mod.isFileAllowedToRun(url, "manifest.json")).resolves.toBe(true);
  });

  it("isFileAllowedToRun warns and returns false when not allowed and not debug", async () => {
    const { mod, logs } = await importServiceWithMocks({
      cached: [],
      evicted: false,
      apiList: [],
      coreConfig: [{ Title: "EnableAppWhiteList", Data: "true" }],
    });
    const url = new URL("https://contoso/not-allowed/app.js");
    const res = await mod.isFileAllowedToRun(url, "manifest.json", true);
    expect(res).toBe(false);
    expect(logs.warn).toHaveBeenCalled();
  });
});
