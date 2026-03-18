import { beforeEach, describe, expect, it, vi } from "vitest";

// Helper to mock dependencies and import fresh module under test
async function importRuntimeStoreWithMocks(state?: {
  queryWeb?: string;
  webAbsoluteUrl?: string;
  site?: any;
  rootWeb?: any;
  web?: any;
  siteStructure?: any;
  allCollections?: string[];
  enabledAppCollections?: string[];
  appItems?: any[];
  logSpy?: ReturnType<typeof vi.fn>;
}) {
  vi.resetModules();

  const {
    queryWeb = "",
    webAbsoluteUrl = "https://contoso.sharepoint.com/sites/demo",
    site = {
      isError: false,
      data: { IsHubSite: false, HubSiteId: "00000000-0000-0000-0000-000000000000" },
    },
    rootWeb = { isError: false, data: { Id: "ROOT-ID" } },
    web = { isError: false, data: { Id: "ROOT-ID" } },
    siteStructure = {},
    allCollections = [],
    enabledAppCollections = [],
    appItems = [],
  } = state || {};

  // Core context service
  vi.doMock("../../core/services/contextService", () => ({
    getWebAbsoluteUrl: () => webAbsoluteUrl,
  }));

  // Logging side effects
  const logSpy = state?.logSpy ?? vi.fn();
  vi.doMock("../../core/services/loggingService", () => ({
    logGenericCoreDebug: logSpy,
  }));

  // Web configurator query url
  vi.doMock("../services/webConfiguratorService", () => ({
    getConfiguringWebUrl: () => queryWeb,
  }));

  // PnP SP client for configuration web
  vi.doMock("../services/pnpService", () => ({
    getPnPSPForConfigurationWeb: () => ({
      /* stub sp */
    }),
  }));

  // Web info service for site/web/root
  vi.doMock("../services/webInfoService", () => ({
    getSite: async () => site,
    getRootWeb: async () => rootWeb,
    getWeb: async () => web,
    getSiteStructure: async () => siteStructure,
  }));

  // App collection and items
  vi.doMock("../services/appCollection", () => ({
    getAllAppCollections: async () => allCollections,
    getAppCollectionConfig: async () => ({ data: { enabledAppCollections, urlMap: [] } }),
  }));

  vi.doMock("../services/renderedAppCollection", () => ({
    getAllAppItems: async () => appItems,
  }));

  // Import module under test
  const mod = await import("../runtimeStore");
  return mod;
}

describe("runtimeStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("uses web absolute url when no query web is provided and sets configurationIsGlobal=true", async () => {
    const url = "https://contoso.sharepoint.com/sites/root";
    const mod = await importRuntimeStoreWithMocks({ queryWeb: "", webAbsoluteUrl: url });
    expect(mod.configurationIsGlobal).toBe(true);
    expect(mod.configurationWebUrl).toBeInstanceOf(URL);
    expect(mod.configurationWebUrl.href).toBe(new URL(url).href);

    // Site equals rootWeb -> site collection
    expect(mod.getConfigurationWebIsSiteCollection()).toBe(true);
    expect(mod.getConfigurationWebIsSubsite()).toBe(false);
  });

  it("uses query web when provided and sets configurationIsGlobal=false", async () => {
    const query = "https://contoso.sharepoint.com/sites/config";
    const mod = await importRuntimeStoreWithMocks({ queryWeb: query });
    expect(mod.configurationIsGlobal).toBe(false);
    expect(mod.configurationWebUrl.href).toBe(new URL(query).href);
  });

  it("computes hub-related flags correctly (root hub and hub child)", async () => {
    const nonEmptyHubId = "11111111-1111-1111-1111-111111111111";
    const mod = await importRuntimeStoreWithMocks({
      site: { isError: false, data: { IsHubSite: true, HubSiteId: nonEmptyHubId } },
      rootWeb: { isError: false, data: { Id: "X" } },
      web: { isError: false, data: { Id: "X" } },
    });
    expect(mod.getConfigurationWebIsRootHub()).toBe(true);
    expect(mod.getConfigurationWebIsHubChild()).toBe(true);
  });

  it("returns hub child = false when site is ok but HubSiteId is EMPTY_GUID", async () => {
    const mod = await importRuntimeStoreWithMocks({
      site: {
        isError: false,
        data: { IsHubSite: false, HubSiteId: "00000000-0000-0000-0000-000000000000" },
      },
      rootWeb: { isError: false, data: { Id: "R" } },
      web: { isError: false, data: { Id: "R" } },
    });
    expect(mod.getConfigurationWebIsHubChild()).toBe(false);
  });

  it("treats unresolved site/root/web as subsite (per error branch)", async () => {
    const mod = await importRuntimeStoreWithMocks({
      site: { isError: true, data: {} },
      rootWeb: { isError: true, data: {} },
      web: { isError: true, data: {} },
    });
    expect(mod.getConfigurationWebIsSubsite()).toBe(true);
    // also, root hub should be false when errors
    expect(mod.getConfigurationWebIsRootHub()).toBe(false);
  });

  it("returns siteCollection=false and subsite=true when ids differ with no errors", async () => {
    const mod = await importRuntimeStoreWithMocks({
      site: {
        isError: false,
        data: { IsHubSite: false, HubSiteId: "00000000-0000-0000-0000-000000000000" },
      },
      rootWeb: { isError: false, data: { Id: "ROOT" } },
      web: { isError: false, data: { Id: "SUB" } },
    });
    expect(mod.getConfigurationWebIsSiteCollection()).toBe(false);
    expect(mod.getConfigurationWebIsSubsite()).toBe(true);
  });

  it("updateApp and getAppItem manage the allAppItems signal", async () => {
    const mod = await importRuntimeStoreWithMocks({ appItems: [] });
    const { EMPTY_APP_MANIFEST } = await import("../../utilities/constants");
    // Initially empty
    expect(mod.allAppItems.value).toEqual([]);
    const item = { name: "MyApp", manifest: EMPTY_APP_MANIFEST, activated: false };
    mod.updateApp(item);
    expect(mod.allAppItems.value.find((i: any) => i.name === "MyApp")).toBeTruthy();
    expect(mod.getAppItem("MyApp")).toMatchObject({ name: "MyApp" });

    // updateSelectedApp with withAppUpdate=true also updates list
    const updated = { ...item, activated: true };
    mod.updateSelectedApp(updated, true);
    expect(mod.selectedAppItem.value).toMatchObject({ name: "MyApp", activated: true });
    expect(mod.allAppItems.value.find((i: any) => i.name === "MyApp")?.activated).toBe(true);
  });

  it("getAppItem returns empty item when not found (covers getEmptyAppItem)", async () => {
    const mod = await importRuntimeStoreWithMocks({ appItems: [] });
    const { EMPTY_APP_MANIFEST } = await import("../../utilities/constants");
    const empty = mod.getAppItem("UnknownApp");
    expect(empty).toMatchObject({
      name: "UnknownApp",
      activated: false,
      manifest: EMPTY_APP_MANIFEST,
    });
  });

  it("changing selectedAppItem alone does not update allAppItems (documents divergence)", async () => {
    const { EMPTY_APP_MANIFEST } = await import("../../utilities/constants");
    const baseApp = { name: "SoloApp", manifest: EMPTY_APP_MANIFEST, activated: false };
    const mod = await importRuntimeStoreWithMocks({ appItems: [baseApp] });
    // Sanity
    expect(mod.allAppItems.value[0]).toMatchObject({ name: "SoloApp", activated: false });
    const originalRef = mod.allAppItems.value[0];
    // Create a modified clone and assign ONLY to selectedAppItem
    const modified = { ...originalRef, activated: true };
    mod.selectedAppItem.value = modified as any;
    // Divergence expectations
    expect(mod.selectedAppItem.value).toMatchObject({ name: "SoloApp", activated: true });
    // allAppItems still holds the original object reference & data
    expect(mod.allAppItems.value[0]).toBe(originalRef);
    expect(mod.allAppItems.value[0].activated).toBe(false);
    // Now reconcile via explicit update
    mod.updateApp(mod.selectedAppItem.value as any);
    expect(mod.allAppItems.value[0].activated).toBe(true);
  });
});
