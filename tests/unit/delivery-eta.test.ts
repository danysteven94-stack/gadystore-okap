import { describe, expect, it } from "vitest";
import { deliveryEta, shopEta } from "@/lib/delivery-eta";

describe("deliveryEta", () => {
  it("pa defini → null", () => {
    expect(deliveryEta(0, 0)).toBeNull();
    expect(deliveryEta(NaN, NaN)).toBeNull();
  });
  it("sèlman yon maksimòm", () => expect(deliveryEta(0, 3)).toBe("Jiska 3 jou"));
  it("menm valè", () => expect(deliveryEta(2, 2)).toBe("2 jou"));
  it("entèval, menm si yo envèse", () => {
    expect(deliveryEta(1, 3)).toBe("1 a 3 jou");
    expect(deliveryEta(3, 1)).toBe("1 a 3 jou");
  });
  it("ignore valè negatif ak desimal", () => {
    expect(deliveryEta(-5, 2.9)).toBe("Jiska 2 jou");
  });
  it("itilize fonksyon tradiksyon an", () => {
    expect(deliveryEta(1, 3, (k, v) => `${k}|${v?.lo}-${v?.hi}`)).toBe("{lo} a {hi} jou|1-3");
  });
});

describe("shopEta", () => {
  it("tolere chan ki manke", () => {
    expect(shopEta({})).toBeNull();
    expect(shopEta({ deliveryMinDays: 1, deliveryMaxDays: 2 })).toBe("1 a 2 jou");
  });
});
