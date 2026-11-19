import { describe, expect, it } from "vitest";
import { signInvoice, verifyInvoice, waNumber } from "@/lib/invoice-token";

describe("lyen fakti siyen", () => {
  it("deterministik epi verifye", () => {
    const t = signInvoice("sale", "abc123");
    expect(t).toMatch(/^[0-9a-f]{32}$/);
    expect(signInvoice("sale", "abc123")).toBe(t);
    expect(verifyInvoice("sale", "abc123", t)).toBe(true);
  });
  it("pa ka itilize pou yon lòt fakti oswa lòt kalite", () => {
    const t = signInvoice("sale", "abc123");
    expect(verifyInvoice("sale", "abc124", t)).toBe(false);
    expect(verifyInvoice("order", "abc123", t)).toBe(false);
  });
  it("rejte token vid, kout oswa modifye", () => {
    const t = signInvoice("order", "x");
    expect(verifyInvoice("order", "x", "")).toBe(false);
    expect(verifyInvoice("order", "x", t.slice(1))).toBe(false);
    expect(verifyInvoice("order", "x", t.replace(/.$/, t.endsWith("0") ? "1" : "0"))).toBe(false);
  });
});

describe("waNumber", () => {
  it("8 chif = Ayiti (+509)", () => expect(waNumber("3712-3456")).toBe("50937123456"));
  it("kenbe nimewo entènasyonal la", () => expect(waNumber("+1 (305) 555-0100")).toBe("13055550100"));
  it("vid", () => {
    expect(waNumber("")).toBe("");
    expect(waNumber("abc")).toBe("");
  });
});
