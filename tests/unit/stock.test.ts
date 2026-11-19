import { describe, expect, it } from "vitest";
import { mergeLines, releaseStock, reserveStock, type StockStore } from "@/lib/stock";

/** Redis fo an memwa: HINCRBY atomik (yon sèl thread JS), ak yon ti reta pou melanje demann yo. */
function fakeStore(stock: Record<string, number>): StockStore & { stock: Record<string, number> } {
  const data = { ...stock };
  return {
    stock: data,
    async hincrby(key, _field, n) {
      await new Promise((r) => setTimeout(r, Math.random() * 3));
      const id = key.replace("product:", "");
      data[id] = (data[id] ?? 0) + n;
      return data[id];
    },
  };
}

describe("mergeLines", () => {
  it("adisyone menm pwodwi", () =>
    expect(mergeLines([{ productId: "a", qty: 2 }, { productId: "b", qty: 1 }, { productId: "a", qty: 3 }])).toEqual([
      { productId: "a", qty: 5 },
      { productId: "b", qty: 1 },
    ]));
});

describe("reserveStock", () => {
  it("debite stok la si gen ase", async () => {
    const s = fakeStore({ a: 10, b: 5 });
    const r = await reserveStock(s, [{ productId: "a", qty: 4 }, { productId: "b", qty: 5 }]);
    expect(r).toEqual({ ok: true, left: { a: 6, b: 0 } });
    expect(s.stock).toEqual({ a: 6, b: 0 });
  });

  it("refize si pa sifi epi pa chanje anyen (tout-oswa-anyen)", async () => {
    const s = fakeStore({ a: 10, b: 2 });
    const r = await reserveStock(s, [{ productId: "a", qty: 4 }, { productId: "b", qty: 3 }]);
    expect(r).toEqual({ ok: false, productId: "b", available: 2 });
    expect(s.stock).toEqual({ a: 10, b: 2 });
  });

  it("menm pwodwi 2 fwa nan yon vant: konte total la", async () => {
    const s = fakeStore({ a: 5 });
    const r = await reserveStock(s, [{ productId: "a", qty: 3 }, { productId: "a", qty: 3 }]);
    expect(r.ok).toBe(false);
    expect(s.stock.a).toBe(5);
  });

  it("stok egzakteman egal a kantite a pase", async () => {
    const s = fakeStore({ a: 3 });
    expect((await reserveStock(s, [{ productId: "a", qty: 3 }])).ok).toBe(true);
    expect(s.stock.a).toBe(0);
  });

  it("COURSE: 20 vant an paralèl sou stok 7 → egzakteman 7 pase, stok pa janm negatif", async () => {
    const s = fakeStore({ a: 7 });
    const results = await Promise.all(Array.from({ length: 20 }, () => reserveStock(s, [{ productId: "a", qty: 1 }])));
    expect(results.filter((r) => r.ok)).toHaveLength(7);
    expect(s.stock.a).toBe(0);
  });

  it("COURSE: vant 2 pwodwi an paralèl, stok final koresponn ak vant ki pase yo", async () => {
    const s = fakeStore({ a: 5, b: 5 });
    const results = await Promise.all(
      Array.from({ length: 10 }, () => reserveStock(s, [{ productId: "a", qty: 1 }, { productId: "b", qty: 2 }]))
    );
    const ok = results.filter((r) => r.ok).length;
    expect(s.stock.a).toBe(5 - ok);
    expect(s.stock.b).toBe(5 - ok * 2);
    expect(s.stock.a >= 0 && s.stock.b >= 0).toBe(true);
  });
});

describe("releaseStock", () => {
  it("remèt kantite yo", async () => {
    const s = fakeStore({ a: 1 });
    await releaseStock(s, [{ productId: "a", qty: 4 }]);
    expect(s.stock.a).toBe(5);
  });
});
