import { logGenericCoreError } from "./loggingService";
const digestCache = new Map<string, string>();
// In-flight requests keyed by web url so concurrent callers share a single
// `/_api/contextinfo` POST instead of each firing their own.
const inFlightDigests = new Map<string, Promise<string>>();

export async function getDigest(webUrl: string, fresh = false) {
  if (!fresh) {
    const cached = digestCache.get(webUrl);
    if (cached) return cached;
  } else {
    // Force a refetch: drop any stale value so callers don't get the old digest.
    digestCache.delete(webUrl);
  }

  // Dedupe concurrent requests (including concurrent `fresh` ones) for the same web.
  const existing = inFlightDigests.get(webUrl);
  if (existing) return existing;

  const request = fetchDigest(webUrl).finally(() => {
    inFlightDigests.delete(webUrl);
  });
  inFlightDigests.set(webUrl, request);
  return request;
}

async function fetchDigest(webUrl: string) {
  const req = await fetch(`${webUrl}/_api/contextinfo`, {
    method: "POST",
    headers: {
      Accept: "application/json;odata=verbose",
      "Content-Type": "application/json",
    },
  });
  if (req.status === 200) {
    const data = await req.json();
    const newDigest = data.d.GetContextWebInformation.FormDigestValue;
    digestCache.set(webUrl, newDigest);
    return newDigest;
  }
  logGenericCoreError("Error while getting digest", req.status);
  return "";
}
