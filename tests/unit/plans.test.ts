import { describe, expect, it } from "vitest";
import { PLANS, PLAN_IDS, businessLimitMessage, isPlanId } from "@/lib/plans";

describe("plans", () => {
  it("isPlanId valide sèlman plan ki egziste", () => {
    for (const id of PLAN_IDS) expect(isPlanId(id)).toBe(true);
    for (const v of ["", "pro", "FULL", null, undefined, 1, {}]) expect(isPlanId(v)).toBe(false);
  });
  it("règ biznis yo", () => {
    expect(PLANS.full.maxBusinesses).toBeNull();
    expect(PLANS.full.publicShop).toBe(true);
    expect(PLANS.solo_shop).toMatchObject({ maxBusinesses: 1, publicShop: true });
    expect(PLANS.duo).toMatchObject({ maxBusinesses: 2, publicShop: false });
  });
  it("chak plan gen id ki koresponn ak kle li", () => {
    for (const [k, v] of Object.entries(PLANS)) expect(v.id).toBe(k);
  });
  it("mesaj limit la mansyone nimewo a", () => {
    expect(businessLimitMessage(2)).toContain("2");
  });
});
