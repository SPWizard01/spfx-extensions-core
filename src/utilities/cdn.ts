import { PUBLIC_CDN_HOST } from "./constants";

/**
 * Rewrites an absolute URL to load through the SharePoint Online public CDN.
 *
 * `https://{host}/{path}` becomes `https://public-cdn.sharepointonline.com/{host}/{path}`,
 * preserving the file name and any query string (e.g. the cache busting `v` parameter).
 */
export function toPublicCdnUrl(url: URL): URL {
  const cdnUrl = new URL(`https://${PUBLIC_CDN_HOST}/${url.host}${url.pathname}`);
  cdnUrl.search = url.search;
  return cdnUrl;
}
