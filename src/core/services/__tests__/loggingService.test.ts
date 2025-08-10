import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stripAnsi(input: string) {
  return input.replace(/\x1b\[[0-9;]*m/g, "");
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("core/services/loggingService", () => {
  it("logGenericCore calls console.log with colored prefix, iso date and args", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { logGenericCore } = await import("../loggingService");
    logGenericCore("msg", { a: 1 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const call = logSpy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["msg", { a: 1 }]);
  });

  it("logGenericCoreError calls console.error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logGenericCoreError } = await import("../loggingService");
    logGenericCoreError("err");
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["err"]);
  });

  it("logGenericCoreWarning calls console.warn", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { logGenericCoreWarning } = await import("../loggingService");
    logGenericCoreWarning("warned", 123);
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["warned", 123]);
  });

  it("logGenericCoreTrace calls console.trace", async () => {
    const spy = vi.spyOn(console, "trace").mockImplementation(() => {});
    const { logGenericCoreTrace } = await import("../loggingService");
    logGenericCoreTrace("trace");
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["trace"]);
  });

  it("logGenericCoreInfo calls console.info", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const { logGenericCoreInfo } = await import("../loggingService");
    logGenericCoreInfo("info");
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["info"]);
  });

  it("logGenericCoreDebug calls console.debug", async () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const { logGenericCoreDebug } = await import("../loggingService");
    logGenericCoreDebug("dbg");
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual(["dbg"]);
  });

  it("logInstanceRequestedError formats message and forwards to console.error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logInstanceRequestedError } = await import("../loggingService");
    const app = { id: "app-id", name: "MyApp" } as any;
    const e = new Error("boom");
    logInstanceRequestedError(app, e);
    const call = spy.mock.calls[0];
    expect(stripAnsi(String(call[0]))).toBe("[SPFxExtensionCore]");
    expect(call[1]).toBe("2020-01-01T00:00:00.000Z");
    expect(call.slice(2)).toEqual([
      "Error while executing onInstanceRequested for app",
      "app-id",
      "with name",
      "MyApp",
      "",
      e,
    ]);
  });

  it("logInstanceRequestedError includes additional data when provided", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logInstanceRequestedError } = await import("../loggingService");
    const app = { id: "app-id", name: "MyApp" } as any;
    logInstanceRequestedError(app, "ERR", "more");
    const call = spy.mock.calls[0];
    expect(call.slice(2)).toEqual([
      "Error while executing onInstanceRequested for app",
      "app-id",
      "with name",
      "MyApp",
      "Additional Data: more",
      "ERR",
    ]);
  });
});
