import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  // Clean any globals the module reads
  delete (window as any).moduleLoaderPromise;
  delete (window as any)._spPageContextInfo;
  vi.resetModules?.();
  vi.restoreAllMocks?.();
});

describe("services/spContextService - getModernContextAsync", () => {
  it("returns context when moduleLoaderPromise is present", async () => {
    const promised = Promise.resolve({ context: { pageContext: { foo: 1 } } });
    (window as any).moduleLoaderPromise = promised;

    const { getModernContextAsync } = await import("../spContextService");
    const ctx = await getModernContextAsync();
    expect(ctx).toEqual({ pageContext: { foo: 1 } });
  });

  it("logs error and returns undefined when moduleLoaderPromise is missing", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getModernContextAsync } = await import("../spContextService");
    const ctx = await getModernContextAsync();
    expect(ctx).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith("Unable to retrieve Modern SP Context...");
  });
});

describe("services/spContextService - getContextInfoAsync", () => {
  it("returns SPOModernContext when pageContext exists in resolved module context", async () => {
    const pageContext = { alpha: 1 };
    (window as any).moduleLoaderPromise = Promise.resolve({ context: { pageContext } });

    const { getContextInfoAsync } = await import("../spContextService");
    const info = await getContextInfoAsync();
    expect(info).toEqual({ contextType: "SPOModernContext", context: pageContext });
  });

  it("throws when module is present but pageContext is missing", async () => {
    (window as any).moduleLoaderPromise = Promise.resolve({ context: { something: true } });

    const { getContextInfoAsync } = await import("../spContextService");
    await expect(getContextInfoAsync()).rejects.toBe(
      "It seems this is a modern page, however it was not possible to retrieve SP Context..."
    );
  });

  it("returns ClassicContext when _spPageContextInfo exists and no moduleLoaderPromise", async () => {
    const classic = { classic: true };
    (window as any)._spPageContextInfo = classic;

    const { getContextInfoAsync } = await import("../spContextService");
    const info = await getContextInfoAsync();
    expect(info).toEqual({ contextType: "ClassicContext", context: classic });
  });

  it("throws when neither modern nor classic context is available", async () => {
    const { getContextInfoAsync } = await import("../spContextService");
    await expect(getContextInfoAsync()).rejects.toBe(
      "It was not possible to retrieve SP Context either through modern or through classic means..."
    );
  });
});
