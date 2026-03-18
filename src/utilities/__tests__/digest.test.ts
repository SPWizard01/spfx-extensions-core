import { beforeAll, describe, expect, it } from "vitest";
import { getContentDigest } from "../digest";

declare global {
  interface Window {
    crypto: Crypto;
  }
}

// beforeAll(() => {
//   const cryptoLike = (globalThis as any).crypto ?? nodeWebcrypto;
//   console.log((globalThis as any).crypto.subtle.digest);
//   if (!(window as any).crypto) {
//     (window as any).crypto = cryptoLike as unknown as Crypto;
//   }
// });

describe("utilities/digest - getContentDigest", () => {
  it("returns full SHA-1 hex for a known string", async () => {
    const hex = await getContentDigest("hello world");
    expect(hex).toBe("2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");
  });

  it("returns the requested prefix when limit > 0", async () => {
    const hex = await getContentDigest("hello world", 8);
    expect(hex).toBe("2aae6c35");
  });

  it("returns full hex when limit is 0 (default)", async () => {
    const hex = await getContentDigest("", 0);
    expect(hex.length).toBe(40);
    expect(hex).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("caps at full length if limit exceeds digest length", async () => {
    const hex = await getContentDigest("hello", 100);
    expect(hex.length).toBe(40);
  });

  it("produces different digests for different inputs", async () => {
    const a = await getContentDigest("abc");
    const b = await getContentDigest("abcd");
    expect(a).not.toBe(b);
    expect(a.length).toBe(40);
    expect(b.length).toBe(40);
  });
});
