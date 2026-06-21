import { describe, expect, it } from "vitest";

import { toPublicCdnUrl } from "../componentLoaderService";

describe("core/services/componentLoaderService toPublicCdnUrl", () => {
  it("rewrites the host into a path segment under the public CDN", () => {
    const input = new URL(
      "https://tenant.sharepoint.com/SPFxExtensions/app/js/entrypoint-j9hpz339.js"
    );
    const result = toPublicCdnUrl(input);
    expect(result.toString()).toBe(
      "https://public-cdn.sharepointonline.com/tenant.sharepoint.com/SPFxExtensions/app/js/entrypoint-j9hpz339.js"
    );
  });

  it("preserves the file name unchanged", () => {
    const input = new URL("https://tenant.sharepoint.com/a/b/entrypoint-abc.js");
    const result = toPublicCdnUrl(input);
    expect(result.pathname.endsWith("/entrypoint-abc.js")).toBe(true);
  });

  it("preserves the cache busting query string", () => {
    const input = new URL("https://tenant.sharepoint.com/a/app.js?v=hash123");
    const result = toPublicCdnUrl(input);
    expect(result.search).toBe("?v=hash123");
    expect(result.toString()).toBe(
      "https://public-cdn.sharepointonline.com/tenant.sharepoint.com/a/app.js?v=hash123"
    );
  });

  it("retains a non-default port as part of the host segment", () => {
    const input = new URL("https://localhost:33355/js/entrypoint-x.js");
    const result = toPublicCdnUrl(input);
    expect(result.toString()).toBe(
      "https://public-cdn.sharepointonline.com/localhost:33355/js/entrypoint-x.js"
    );
  });
});
