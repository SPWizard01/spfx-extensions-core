import { h, render } from "preact";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the heavy components tree used by App to keep tests light
vi.mock("../components", () => ({
  Index: () => h("div", { "data-testid": "index-stub" }, "IndexStub"),
}));

// Mock Fluent UI provider & theme creators to avoid React context wiring in tests
vi.mock("@fluentui/react-components", async () => {
  const { h } = await import("preact");
  const createLightTheme = vi.fn(() => ({ __theme: "light" }));
  const createDarkTheme = vi.fn(() => ({ __theme: "dark" }));
  const FluentProvider = ({ children, theme, ...props }: any) =>
    h(
      "div",
      { "data-testid": "fluent-provider", "data-theme": theme?.__theme ?? "", theme, ...props },
      children
    );
  return { FluentProvider, createLightTheme, createDarkTheme };
});

// Mock brand variants creation to observe palette usage
vi.mock("@fluentui/react-migration-v8-v9", () => {
  return {
    createBrandVariants: vi.fn((palette: any) => ({ __variantsFrom: palette })),
  };
});

describe("App module", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    // Ensure the Edit button exists and is visible before each import
    const cmdBar = document.querySelector("#spCommandBar") ?? document.createElement("div");
    if (!cmdBar.id) {
      cmdBar.id = "spCommandBar";
      document.body.appendChild(cmdBar);
    }
    let editBtn = cmdBar.querySelector("button[name='Edit']") as HTMLButtonElement | null;
    if (!editBtn) {
      editBtn = document.createElement("button");
      editBtn.setAttribute("name", "Edit");
      cmdBar.appendChild(editBtn);
    }
    editBtn.removeAttribute("style");
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("hides the Edit button on module load", async () => {
    const editBtn = document.querySelector(
      "#spCommandBar button[name='Edit']"
    ) as HTMLButtonElement | null;
    expect(editBtn).toBeTruthy();
    // Importing the module should apply the side-effect that hides the button
    await import("../app");
    expect(editBtn?.getAttribute("style")).toMatch(/display\s*:\s*none/);
  });

  it("renders FluentProvider and Index (mocked)", async () => {
    const { App } = await import("../app");
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
    } as any;

    render(h(App, { instance }), host);
    const stub = host.querySelector('[data-testid="index-stub"]');
    expect(stub).toBeTruthy();
  });

  it("uses light theme when isInverted=false and passes theme to provider", async () => {
    // Arrange globals for theme selection
    // @ts-ignore
    window.__globalSettings__.customizations.settings.theme.isInverted = false;
    // @ts-ignore
    const testPalette = { primary: "#fff" };
    // @ts-ignore
    window.__globalSettings__.customizations.settings.theme.palette = testPalette;

    const comps = await import("@fluentui/react-components");
    const brands = await import("@fluentui/react-migration-v8-v9");

    const { App } = await import("../app");
    const instance = { domElement: host } as any;
    render(h(App, { instance }), host);

    // createBrandVariants called with palette
    expect(brands.createBrandVariants as any).toHaveBeenCalledTimes(1);
    expect(brands.createBrandVariants as any).toHaveBeenCalledWith(testPalette);
    // Light theme chosen
    expect(comps.createLightTheme as any).toHaveBeenCalledTimes(1);
    expect(comps.createDarkTheme as any).not.toHaveBeenCalled();

    // Provider received the theme and the style height=100%
    const provider = host.querySelector('[data-testid="fluent-provider"]') as HTMLElement;
    expect(provider).toBeTruthy();
    expect(provider.getAttribute("data-theme")).toBe("light");
    expect((provider as HTMLDivElement).style.height).toBe("100%");
  });

  it("uses dark theme when isInverted=true", async () => {
    // @ts-ignore
    window.__globalSettings__.customizations.settings.theme.isInverted = true;
    // @ts-ignore
    window.__globalSettings__.customizations.settings.theme.palette = { accent: "#000" };

    const comps = await import("@fluentui/react-components");
    await import("../app");
    expect(comps.createDarkTheme as any).toHaveBeenCalledTimes(1);
    expect(comps.createLightTheme as any).not.toHaveBeenCalled();
  });

  it("does not crash when Edit button is absent", async () => {
    const cmd = document.querySelector("#spCommandBar");
    cmd?.remove();
    await import("../app");
    // No assertions needed; absence of throw is success. Ensure still renderable.
    const { App } = await import("../app");
    render(h(App, { instance: { domElement: host } as any }), host);
    const providerEl = host.querySelector('[data-testid="fluent-provider"]') as HTMLElement | null;
    expect(providerEl).toBeTruthy();
    expect((providerEl as HTMLElement).children.length).toBeGreaterThan(0);
  });
});
