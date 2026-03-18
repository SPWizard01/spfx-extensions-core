import { h } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SPFxExtensionAppInstance } from "../../models/appModel";

// Mock the heavy App component before importing the module under test
vi.mock("../app", () => {
  return {
    App: () => h("div", { id: "mock-app" }, "Mocked App"),
  };
});
vi.mock("preact/debug", () => {
  // this should not run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (globalThis as any).__preactDebugImported = 1;
  vi.stubGlobal("__preactDebugImported", 1);
  return {};
});
// Avoid importing the entire configurator components tree

// describe("__spfxCoreConfigurator debug import", () => {
//   beforeEach(() => {
//     vi.resetModules();
//     console.log("Resetting __preactDebugImported");
//   });
//   it("imports preact/debug when DEBUG is true", async () => {
//     vi.resetModules();
//     // track side-effect when 'preact/debug' is imported
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     // (globalThis as any).DEBUG = true;
//     //vi.stubEnv("DEBUG", "true");
//     vi.stubGlobal("DEBUG", true);
//     await import("../__spfxCoreConfigurator");
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     expect((globalThis as any).__preactDebugImported).toBe(1);
//   });

//   // it("does not import preact/debug when DEBUG is false", async () => {
//   //   vi.resetModules();
//   //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   //   delete (globalThis as any).__preactDebugImported;
//   //   // (globalThis as any).DEBUG = false;

//   //   await import("../__spfxCoreConfigurator");
//   //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   //   expect((globalThis as any).__preactDebugImported).toBeUndefined();
//   // });
// });

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
    vi.resetModules();
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
    const { launch } = await import("../__spfxCoreConfigurator");
    const cleanup = await launch(instance);
    expect(typeof cleanup).toBe("function");
    // Should have some child nodes after render
    expect(host.childNodes.length).toBeGreaterThan(0);

    // When cleanup is called, preact render(null, el) should clear the container
    cleanup();
    expect(host.childNodes.length).toBe(0);
  });

  it("does nothing if domElement is missing but still returns cleanup", async () => {
    vi.resetModules();
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
    const { launch } = await import("../__spfxCoreConfigurator");
    const cleanup = await launch(instance);
    expect(typeof cleanup).toBe("function");
  });
});
