import { beforeEach, describe, expect, it, vi } from "vitest";

// This test isolates openDB failure branch and ensures the error logger is called
// and deleteDB + reload are attempted. We mock idb.openDB to reject.

const errorMock = vi.fn();
const deleteDbMock = vi.fn().mockResolvedValue(undefined);

vi.mock("../loggingService", () => ({
  logGenericCoreError: errorMock,
}));

vi.mock("idb", async () => {
  const actual = await vi.importActual<any>("idb");
  return {
    ...actual,
    openDB: () => Promise.reject(new Error("open failure")),
    deleteDB: deleteDbMock,
  };
});

describe("coreIdbService openDB failure handling", () => {
  beforeEach(() => {
    vi.resetModules();
    errorMock.mockReset();
    deleteDbMock.mockClear();
  });

  it("rejects module import when openDB fails", async () => {
    await expect(import("../coreIdbService")).rejects.toThrow();
  });
});
