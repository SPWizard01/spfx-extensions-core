import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock for loggingService so factory can reference it safely
const { warnMock } = vi.hoisted(() => ({ warnMock: vi.fn() }));
vi.mock("../../core/services/loggingService", () => ({
  logGenericCoreWarning: warnMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  warnMock.mockReset();
});

describe("utilities/helpers - emptyDummy", () => {
  it("logs a warning and returns a no-op function", async () => {
    const { emptyDummy } = await import("../helpers");
    const fn = emptyDummy();

    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(typeof fn).toBe("function");
    // no throws when calling the returned function
    expect(() => fn()).not.toThrow();
  });
});

describe("utilities/helpers - context IDs", () => {
  it("initial context comes from randomUUID, getNewContext updates it", async () => {
    // Stub initial randomUUID before module import (module reads it at top-level)
    const rnd = vi.fn().mockReturnValueOnce("id-1").mockReturnValueOnce("id-2");
    if ((globalThis as any).crypto?.randomUUID) {
      vi.spyOn((globalThis as any).crypto, "randomUUID").mockImplementation(rnd);
    } else {
      (globalThis as any).crypto = { randomUUID: rnd };
    }

    const { getCurrentContextId, getNewContext } = await import("../helpers");

    expect(getCurrentContextId()).toBe("id-1");
    const newId = getNewContext();
    expect(newId).toBe("id-2");
    expect(getCurrentContextId()).toBe("id-2");
    expect(rnd).toHaveBeenCalledTimes(2);
  });
});

describe("utilities/helpers - extractGUIDFromString", () => {
  it("removes leading/trailing braces", async () => {
    const { extractGUIDFromString } = await import("../helpers");
    expect(extractGUIDFromString("{1234-ABCD}")).toBe("1234-ABCD");
  });

  it("returns input unchanged when no braces present", async () => {
    const { extractGUIDFromString } = await import("../helpers");
    expect(extractGUIDFromString("1234-ABCD")).toBe("1234-ABCD");
  });
});

describe("utilities/helpers - cloneObject", () => {
  it("returns a deep-cloned copy (JSON semantics)", async () => {
    const { cloneObject } = await import("../helpers");
    const original = { a: 1, b: { c: 2 } };
    const copy = cloneObject(original);

    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);

    // mutate copy and ensure original unchanged
    (copy as any).b.c = 3;
    expect(original.b.c).toBe(2);
  });
});
