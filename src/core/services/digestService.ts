import { logGenericCoreError } from "./loggingService";
const digestCache = new Map<string, string>();
export async function getDigest(webUrl: string, fresh = false) {
  let digest = "";
  if (digestCache.has(webUrl) && !fresh) {
    digest = digestCache.get(webUrl) || "";
  }
  if (digest) return digest;
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
  } else {
    logGenericCoreError("Error while getting digest", req.status);
  }
  return "";
}
