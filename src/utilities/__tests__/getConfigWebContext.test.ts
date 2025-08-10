import { beforeEach, describe, expect, it, vi } from "vitest";

// Helper to (re)mock runtimeStore flags and import fresh module under test
async function loadWithState(state: {
  configurationIsGlobal?: boolean;
  isRootHub?: boolean;
  isHubChild?: boolean;
  isSubsite?: boolean;
}) {
  vi.resetModules();
  vi.doMock("../../configurator/runtimeStore", () => ({
    // exported constant
    configurationIsGlobal: state.configurationIsGlobal ?? false,
    // exported functions
    getConfigurationWebIsRootHub: () => !!state.isRootHub,
    getConfigurationWebIsHubChild: () => !!state.isHubChild,
    getConfigurationWebIsSubsite: () => !!state.isSubsite,
  }));
  const mod = await import("../getConfigWebContext");
  return mod.GetWebConfigContext as () => string;
}

describe("GetWebConfigContext", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 'global' when configurationIsGlobal is true", async () => {
    const getCtx = await loadWithState({ configurationIsGlobal: true });
    expect(getCtx()).toBe("global");
  });

  it("returns 'hubRoot' when site is hub root (takes precedence)", async () => {
    const getCtx = await loadWithState({
      isRootHub: true,
      isHubChild: true,
      configurationIsGlobal: false,
    });
    expect(getCtx()).toBe("hubRoot");
  });

  it("returns 'hubChild' when hub child and not hub root", async () => {
    const getCtx = await loadWithState({ isHubChild: true, isRootHub: false });
    expect(getCtx()).toBe("hubChild");
  });

  it("returns 'nonHub' when not a hub child", async () => {
    const getCtx = await loadWithState({ isHubChild: false, isRootHub: false });
    expect(getCtx()).toBe("nonHub");
  });

  it("does not return 'subsite' due to earlier returns: hubChild true still yields 'hubChild'", async () => {
    const getCtx = await loadWithState({ isHubChild: true, isRootHub: false, isSubsite: true });
    expect(getCtx()).toBe("hubChild");
  });

  it("does not reach 'subsite' when hubChild is false; returns 'nonHub' instead", async () => {
    const getCtx = await loadWithState({ isHubChild: false, isSubsite: true });
    expect(getCtx()).toBe("nonHub");
  });

  it("returns 'subsite' when first hubChild=false then true, and subsite=true", async () => {
    vi.resetModules();
    const childSeq = [false, true];
    vi.doMock("../../configurator/runtimeStore", () => ({
      configurationIsGlobal: false,
      getConfigurationWebIsRootHub: () => false,
      getConfigurationWebIsHubChild: () => (childSeq.length ? childSeq.shift()! : false),
      getConfigurationWebIsSubsite: () => true,
    }));
    const { GetWebConfigContext } = await import("../getConfigWebContext");
    expect(GetWebConfigContext()).toBe("subsite");
  });

  it("returns 'other' when first hubChild=false then true, and subsite=false", async () => {
    vi.resetModules();
    const childSeq = [false, true];
    vi.doMock("../../configurator/runtimeStore", () => ({
      configurationIsGlobal: false,
      getConfigurationWebIsRootHub: () => false,
      getConfigurationWebIsHubChild: () => (childSeq.length ? childSeq.shift()! : false),
      getConfigurationWebIsSubsite: () => false,
    }));
    const { GetWebConfigContext } = await import("../getConfigWebContext");
    expect(GetWebConfigContext()).toBe("other");
  });
});
