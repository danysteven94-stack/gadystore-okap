import { describe, expect, it } from "vitest";
import { generateTempPassword, isTrue } from "@/lib/password";

describe("generateTempPassword", () => {
  it("fòma XXXXX-XXXXX, san karaktè ki konfonn", () => {
    for (let i = 0; i < 200; i++) {
      const p = generateTempPassword();
      expect(p).toMatch(/^[A-HJ-NP-Za-km-z2-9]{5}-[A-HJ-NP-Za-km-z2-9]{5}$/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[2-9]/);
    }
  });
  it("pa repete", () => {
    expect(new Set(Array.from({ length: 100 }, generateTempPassword)).size).toBe(100);
  });
});

describe("isTrue", () => {
  it("aksepte true ak 'true' (Upstash ka bay youn oswa lòt)", () => {
    expect(isTrue(true)).toBe(true);
    expect(isTrue("true")).toBe(true);
  });
  it("rejte tout rès la", () => {
    for (const v of [false, "false", "", 0, 1, null, undefined, "TRUE"]) expect(isTrue(v)).toBe(false);
  });
});
