export async function getContentHash(content: string, limit: number = 0) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hash = await window.crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hash)); // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
  return limit > 0 ? hashHex.substring(0, limit) : hashHex;
}
