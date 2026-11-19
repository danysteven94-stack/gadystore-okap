// Rezèvasyon stok atomik: HINCRBY se atomik nan Redis, kidonk 2 vant an menm tan pa ka debite pi plis pase sa ki rete.
// Si yon liy pa sifi, tout sa nou te deja rezève a retounen (tout-oswa-anyen).

export type StockStore = { hincrby(key: string, field: string, increment: number): Promise<number> };
export type StockLine = { productId: string; qty: number };

export type ReserveResult =
  | { ok: true; left: Record<string, number> } // stok ki rete pa pwodwi
  | { ok: false; productId: string; available: number };

const keyOf = (productId: string) => `product:${productId}`;

/** Fusionne liy ki gen menm pwodwi (yon sèl debi pou chak pwodwi). */
export function mergeLines(lines: StockLine[]): StockLine[] {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.qty);
  return [...m].map(([productId, qty]) => ({ productId, qty }));
}

export async function releaseStock(store: StockStore, lines: StockLine[]): Promise<void> {
  await Promise.all(lines.map((l) => store.hincrby(keyOf(l.productId), "stock", l.qty)));
}

export async function reserveStock(store: StockStore, lines: StockLine[]): Promise<ReserveResult> {
  const merged = mergeLines(lines);
  const done: StockLine[] = [];
  const left: Record<string, number> = {};
  for (const l of merged) {
    const after = await store.hincrby(keyOf(l.productId), "stock", -l.qty);
    if (after < 0) {
      // Pa sifi: remèt liy sa a ak tout lòt yo ki te deja pase.
      await store.hincrby(keyOf(l.productId), "stock", l.qty);
      await releaseStock(store, done);
      return { ok: false, productId: l.productId, available: after + l.qty };
    }
    done.push(l);
    left[l.productId] = after;
  }
  return { ok: true, left };
}
