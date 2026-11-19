import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecovery,
  otpauthUri,
  verifyTotp,
} from "@/lib/totp";

// Vektè ofisyèl RFC 6238 (SHA-1). Sekrè = ASCII "12345678901234567890".
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"));
const RFC_VECTORS: Array<[number, string]> = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
  [20000000000, "353130"],
];

describe("TOTP (RFC 6238)", () => {
  it("base32 aleprè-retou", () => {
    expect(RFC_SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(base32Decode(RFC_SECRET).toString()).toBe("12345678901234567890");
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(s))).toBe(s);
  });

  it.each(RFC_VECTORS)("aksepte kòd ofisyèl la a T=%i", (t, code) => {
    expect(verifyTotp(RFC_SECRET, code, t * 1000)).toBe(Math.floor(t / 30));
  });

  it("tolere ±1 etap (30 s) men pa plis", () => {
    const t = 1111111109 * 1000;
    const code = "081804";
    expect(verifyTotp(RFC_SECRET, code, t + 30_000)).not.toBeNull();
    expect(verifyTotp(RFC_SECRET, code, t - 30_000)).not.toBeNull();
    expect(verifyTotp(RFC_SECRET, code, t + 90_000)).toBeNull();
  });

  it("rejte kòd ki pa valid", () => {
    const t = 59_000;
    expect(verifyTotp(RFC_SECRET, "000000", t)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "12345", t)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "abcdef", t)).toBeNull();
    expect(verifyTotp(RFC_SECRET, "", t)).toBeNull();
  });

  it("ignore espas nan kòd la", () => {
    expect(verifyTotp(RFC_SECRET, "287 082", 59_000)).not.toBeNull();
  });

  it("bati yon URI otpauth kòrèk", () => {
    const uri = otpauthUri("a@b.com", "ABC234");
    expect(uri).toMatch(/^otpauth:\/\/totp\/Platfomnou%3Aa%40b\.com\?/);
    expect(uri).toContain("secret=ABC234");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});

describe("chifreman sekrè", () => {
  it("chifre epi dechifre", () => {
    const enc = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DPEHPK3PXP");
    expect(enc.startsWith("v1.")).toBe(true);
    expect(decryptSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("chak chifreman diferan (IV o aza)", () => {
    expect(encryptSecret("X")).not.toBe(encryptSecret("X"));
  });

  it("retounen null si done yo manipile oswa kase", () => {
    const enc = encryptSecret("SECRET");
    const parts = enc.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(decryptSecret(parts.join("."))).toBeNull();
    expect(decryptSecret("pa-yon-chifreman")).toBeNull();
    expect(decryptSecret("")).toBeNull();
  });
});

describe("kòd rekiperasyon", () => {
  it("jenere 8 kòd inik nan fòm XXXXX-XXXXX", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
  });

  it("hash la inyore tirè, espas ak majiskil", () => {
    expect(hashRecovery("abcde-fghjk")).toBe(hashRecovery(" ABCDE FGHJK "));
    expect(hashRecovery("ABCDE-FGHJK")).not.toBe(hashRecovery("ABCDE-FGHJM"));
    expect(hashRecovery("ABCDE-FGHJK")).toMatch(/^[0-9a-f]{64}$/);
  });
});
