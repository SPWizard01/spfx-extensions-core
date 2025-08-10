import { h } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the heavy App component before importing the module under test
vi.mock("../app", () => {
  return {
    App: () => h("div", { id: "mock-app" }, "Mocked App"),
  };
});

// Avoid importing the entire configurator components tree
import type { SPFxExtensionAppInstance } from "../../models/appModel";

describe("__spfxCoreConfigurator debug import", () => {
  it("imports preact/debug when DEBUG is true", async () => {
    vi.resetModules();
    // track side-effect when 'preact/debug' is imported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__preactDebugImported = 0;
    vi.stubGlobal("DEBUG", true);
    vi.mock("preact/debug", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__preactDebugImported++;
      return {};
    });
    await import("../__spfxCoreConfigurator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__preactDebugImported).toBe(1);
  });

  it("does not import preact/debug when DEBUG is false", async () => {
    vi.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).__preactDebugImported;
    vi.stubGlobal("DEBUG", false);
    vi.mock("preact/debug", () => {
      // this should not run
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__preactDebugImported =
        ((globalThis as any).__preactDebugImported || 0) + 1;
      return {};
    });
    await import("../__spfxCoreConfigurator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__preactDebugImported).toBeUndefined();
  });
});

import { launch } from "../__spfxCoreConfigurator";

describe("launch()", () => {
  let host: HTMLElement;
  //   beforeAll(async () => {
  //     console.log("BeforeAll");
  //     await import("./setup");
  //   });
  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
  });

  it("renders into provided domElement and returns a cleanup function", async () => {
    const instance = {
      key: "k",
      contextId: "ctx",
      unmountOnRender: true,
      instanceRequested: false,
      instanceExecuted: false,
      unmount: () => {},
      addEventListener: () => () => {},
      executeListeners: () => {},
      allEventListeners: [],
      instanceLoadPromise: Promise.resolve(),
      instanceLoadPromiseResolver: () => {},
      domElement: host,
    } as unknown as SPFxExtensionAppInstance;

    const cleanup = await launch(instance);
    expect(typeof cleanup).toBe("function");
    // Should have some child nodes after render
    expect(host.childNodes.length).toBeGreaterThan(0);

    // When cleanup is called, preact render(null, el) should clear the container
    cleanup();
    expect(host.childNodes.length).toBe(0);
  });

  it("does nothing if domElement is missing but still returns cleanup", async () => {
    const instance = {
      key: "k",
      contextId: "ctx",
      unmountOnRender: true,
      instanceRequested: false,
      instanceExecuted: false,
      unmount: () => {},
      addEventListener: () => () => {},
      executeListeners: () => {},
      allEventListeners: [],
      instanceLoadPromise: Promise.resolve(),
      instanceLoadPromiseResolver: () => {},
    } as unknown as SPFxExtensionAppInstance;

    const cleanup = await launch(instance);
    expect(typeof cleanup).toBe("function");
  });
});
