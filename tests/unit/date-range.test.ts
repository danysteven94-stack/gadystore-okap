import { describe, expect, it } from "vitest";
import { daysBetween, eachDate, isYmd, validateRange } from "@/lib/date-range";

describe("isYmd", () => {
  it("aksepte dat reyèl", () => {
    expect(isYmd("2026-11-18")).toBe(true);
    expect(isYmd("2028-02-29")).toBe(true);
  });
  it("rejte fòma ak dat enposib", () => {
    for (const v of ["2026-02-31", "2027-02-29", "2026-13-01", "26-11-18", "2026/11/18", "", "abc", null, 20261118]) {
      expect(isYmd(v)).toBe(false);
    }
  });
});

describe("eachDate / daysBetween", () => {
  it("lis chak jou, enklizif", () => {
    expect(eachDate("2026-11-29", "2026-12-02")).toEqual(["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
    expect(eachDate("2026-11-18", "2026-11-18")).toEqual(["2026-11-18"]);
    expect(daysBetween("2026-11-29", "2026-12-02")).toBe(4);
  });
  it("pa gen jou ki manke oswa double nan chanjman lè (DST)", () => {
    const d = eachDate("2026-03-01", "2026-03-31");
    expect(d).toHaveLength(31);
    expect(new Set(d).size).toBe(31);
  });
  it("retounen [] si from > to", () => expect(eachDate("2026-12-01", "2026-11-01")).toEqual([]));
});

describe("validateRange", () => {
  it("bon entèval", () => expect(validateRange("2026-01-01", "2026-12-31")).toBeNull());
  it("1 jou", () => expect(validateRange("2026-11-18", "2026-11-18")).toBeNull());
  it("two long", () => expect(validateRange("2000-01-01", "2026-11-18")).toContain("two long"));
  it("limit la a 366 jou", () => {
    expect(validateRange("2026-01-01", "2027-01-01")).toBeNull(); // 366 jou
    expect(validateRange("2026-01-01", "2027-01-02")).toContain("two long"); // 367
  });
  it("fòma pa valid oswa envèse", () => {
    expect(validateRange("abc", "2026-01-01")).toContain("fòma");
    expect(validateRange("2026-02-01", "2026-01-01")).toContain("anvan");
    expect(validateRange(undefined, "2026-01-01")).toContain("fòma");
  });
});
