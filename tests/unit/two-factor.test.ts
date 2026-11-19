import { describe, expect, it } from "vitest";
import { toStringArray } from "@/lib/two-factor";

describe("toStringArray", () => {
  it("aksepte yon tab deja pars", () => expect(toStringArray(["a", "b"])).toEqual(["a", "b"]));
  it("pars yon string JSON", () => expect(toStringArray('["a","b"]')).toEqual(["a", "b"]));
  it("konvèti eleman yo an string", () => expect(toStringArray([1, 2])).toEqual(["1", "2"]));
  it("retounen [] pou done ki pa valid", () => {
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray("")).toEqual([]);
    expect(toStringArray("pa json")).toEqual([]);
    expect(toStringArray('{"a":1}')).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
  });
});
