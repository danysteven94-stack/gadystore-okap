import { describe, expect, it } from "vitest";
import { pageMeta, parsePage } from "@/lib/pagination";

const sp = (q: string) => new URLSearchParams(q);
const opts = { defaultLimit: 100, maxLimit: 100 };

describe("parsePage", () => {
  it("valè defo", () => expect(parsePage(sp(""), opts)).toEqual({ limit: 100, offset: 0 }));
  it("li limit ak offset", () => expect(parsePage(sp("limit=20&offset=40"), opts)).toEqual({ limit: 20, offset: 40 }));
  it("bòne limit la (max ak min 1)", () => {
    expect(parsePage(sp("limit=5000"), opts).limit).toBe(100);
    expect(parsePage(sp("limit=0"), opts).limit).toBe(1);
    expect(parsePage(sp("limit=-3"), opts).limit).toBe(1);
  });
  it("offset negatif oswa fo → 0", () => {
    expect(parsePage(sp("offset=-5"), opts).offset).toBe(0);
    expect(parsePage(sp("offset=abc"), opts).offset).toBe(0);
  });
  it("limit ki pa valid → defo", () => expect(parsePage(sp("limit=abc"), opts).limit).toBe(100));
  it("desimal → antye", () => expect(parsePage(sp("limit=10.9&offset=3.7"), opts)).toEqual({ limit: 10, offset: 3 }));
  it("limit vid → defo", () => expect(parsePage(sp("limit="), { defaultLimit: 50, maxLimit: 200 }).limit).toBe(50));
});

describe("pageMeta", () => {
  it("gen plis", () => expect(pageMeta(250, 0, 100)).toEqual({ total: 250, hasMore: true, nextOffset: 100 }));
  it("dènye paj", () => expect(pageMeta(250, 200, 50)).toEqual({ total: 250, hasMore: false, nextOffset: null }));
  it("vid", () => expect(pageMeta(0, 0, 0)).toEqual({ total: 0, hasMore: false, nextOffset: null }));
});
