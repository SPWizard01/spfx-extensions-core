import { beforeEach, describe, expect, it, vi } from "vitest";

// Important: isInDebug is computed at module evaluation time.
// To test it deterministically we must set localStorage first,
// then import the module after resetModules.

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

async function importDebug() {
  return await import("../debug");
}

describe("utilities/debug", () => {
  it("isFileInDebug returns true for localhost and false otherwise", async () => {
    const { isFileInDebug } = await importDebug();
    expect(isFileInDebug(new URL("http://localhost:3000"))).toBe(true);
    expect(isFileInDebug(new URL("https://LOCALHOST"))).toBe(true);
    expect(isFileInDebug(new URL("https://contoso.sharepoint.com"))).toBe(false);
  });

  it("isAppInDebug reflects SPFXEXT_<app> values in localStorage", async () => {
    localStorage.setItem("SPFXEXT_MyApp", "1");
    const { isAppInDebug } = await importDebug();
    expect(isAppInDebug("MyApp")).toBe(true);
    localStorage.setItem("SPFXEXT_MyApp", "0");
    expect(isAppInDebug("MyApp")).toBe(false);
    localStorage.removeItem("SPFXEXT_MyApp");
    expect(isAppInDebug("MyApp")).toBe(false);
  });

  it("isInDebug is true when any SPFXEXT_* key has a positive number", async () => {
    localStorage.setItem("SPFXEXT_A", "0");
    localStorage.setItem("SPFXEXT_B", "2");
    const { isInDebug } = await importDebug();
    expect(isInDebug).toBe(true);
  });

  it("isInDebug is false when no SPFXEXT_* key is > 0", async () => {
    localStorage.setItem("SPFXEXT_A", "0");
    localStorage.setItem("SPFXEXT_B", "-1");
    const { isInDebug } = await importDebug();
    expect(isInDebug).toBe(false);
  });
});
