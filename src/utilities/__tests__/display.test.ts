import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getClassicDisplayMode, getModernDisplayMode } from "../display";

declare global {
  interface Window {
    MSOLayout_InDesignMode?: { value?: string };
    MSOLayout_IsWikiEditMode?: () => boolean;
    MSOLayout_inDesignMode?: boolean;
  }
}

const resetClassicFlags = () => {
  delete window.MSOLayout_InDesignMode;
  delete window.MSOLayout_IsWikiEditMode;
  delete window.MSOLayout_inDesignMode;
};

beforeEach(() => {
  resetClassicFlags();
  // Reset location to a known state
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  resetClassicFlags();
});

describe("utilities/display - getClassicDisplayMode", () => {
  it("returns Edit when MSOLayout_InDesignMode.value === '1'", () => {
    window.MSOLayout_InDesignMode = { value: "1" };
    expect(getClassicDisplayMode()).toBe("Edit");
  });

  it("returns Edit when MSOLayout_IsWikiEditMode() is true", () => {
    window.MSOLayout_IsWikiEditMode = () => true;
    expect(getClassicDisplayMode()).toBe("Edit");
  });

  it("returns Edit when MSOLayout_inDesignMode is truthy", () => {
    window.MSOLayout_inDesignMode = true;
    expect(getClassicDisplayMode()).toBe("Edit");
  });

  it("returns Read when none of the classic edit flags are set", () => {
    expect(getClassicDisplayMode()).toBe("Read");
  });
});

describe("utilities/display - getModernDisplayMode", () => {
  it("returns Edit when query contains Mode=Edit", () => {
    window.history.pushState({}, "", "/page?foo=1&Mode=Edit");
    expect(getModernDisplayMode()).toBe("Edit");
  });

  it("returns Read when query does not contain Mode=Edit", () => {
    window.history.pushState({}, "", "/page?view=read");
    expect(getModernDisplayMode()).toBe("Read");
  });
});
