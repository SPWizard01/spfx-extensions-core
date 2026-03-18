import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted error mock so the module mock can reference it
// const { errorMock } = vi.hoisted(() => ({ errorMock: vi.fn() }));
const errorMock = vi.fn();
vi.mock("../loggingService", () => ({ logGenericCoreError: errorMock }));

const makeFetchOk = (digest: string) =>
  vi.fn().mockResolvedValue({
    status: 200,
    json: async () => ({ d: { GetContextWebInformation: { FormDigestValue: digest } } }),
  } as any);

const makeFetchErr = (status = 500) => vi.fn().mockResolvedValue({ status } as any);

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  errorMock.mockReset();
});

describe("core/services/digestService - getDigest", () => {
  const webUrl = "https://contoso.sharepoint.com/sites/demo";
  const endpoint = `${webUrl}/_api/contextinfo`;

  it("fetches digest and caches by webUrl", async () => {
    const fetchMock = makeFetchOk("DIG1");
    (globalThis as any).fetch = fetchMock;

    const { getDigest } = await import("../digestService");
    const first = await getDigest(webUrl);
    expect(first).toBe("DIG1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json;odata=verbose",
        "Content-Type": "application/json",
      },
    });

    const second = await getDigest(webUrl);
    expect(second).toBe("DIG1");
    // Should not call fetch again due to cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when fresh=true and updates cache", async () => {
    // First call returns DIG1
    let fetchMock = makeFetchOk("DIG1");
    (globalThis as any).fetch = fetchMock;
    const { getDigest } = await import("../digestService");

    const first = await getDigest(webUrl);
    expect(first).toBe("DIG1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Next call with fresh=true returns DIG2 and updates cache
    fetchMock = makeFetchOk("DIG2");
    (globalThis as any).fetch = fetchMock;
    const freshDigest = await getDigest(webUrl, true);
    expect(freshDigest).toBe("DIG2");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Now subsequent default call should use cached DIG2 (no extra fetch)
    const cached = await getDigest(webUrl);
    expect(cached).toBe("DIG2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("logs and returns empty string on non-200 response", async () => {
    const fetchMock = makeFetchErr(403);
    (globalThis as any).fetch = fetchMock;
    const { getDigest } = await import("../digestService");

    const result = await getDigest(webUrl, true);
    expect(result).toBe("");
    expect(errorMock).toHaveBeenCalledWith("Error while getting digest", 403);
  });
});
