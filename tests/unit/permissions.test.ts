import { describe, expect, it } from "vitest";
import { can, pricesMatch, type UserRole } from "@/lib/permissions";

describe("can (RBAC)", () => {
  it("admin fè tout bagay", () => {
    for (const a of ["products:write", "sales:write", "*", "nenpòt:bagay"]) expect(can("admin", a)).toBe(true);
  });
  it("gestionnaire jere pwodwi men pa itilizatè/backup (*)", () => {
    expect(can("gestionnaire", "products:write")).toBe(true);
    expect(can("gestionnaire", "sales:write")).toBe(true);
    expect(can("gestionnaire", "*")).toBe(false);
  });
  it("caissier pa ka modifye pwodwi, sèlman vann", () => {
    expect(can("caissier", "products:write")).toBe(false);
    expect(can("caissier", "*")).toBe(false);
    expect(can("caissier", "sales:write")).toBe(true);
    expect(can("caissier", "invoices:print")).toBe(true);
  });
  it("wòl enkoni oswa vid → refize (pa janm kraze)", () => {
    expect(can("hacker" as UserRole, "products:write")).toBe(false);
    expect(can(undefined as unknown as UserRole, "*")).toBe(false);
  });
});

describe("pricesMatch", () => {
  it("egal oswa tolerans santim", () => {
    expect(pricesMatch(100, 100)).toBe(true);
    expect(pricesMatch(99.999, 100)).toBe(true);
  });
  it("rejte yon pri diferan (pri 0 oswa rabè kache)", () => {
    expect(pricesMatch(0, 100)).toBe(false);
    expect(pricesMatch(99, 100)).toBe(false);
    expect(pricesMatch(100.5, 100)).toBe(false);
  });
});
