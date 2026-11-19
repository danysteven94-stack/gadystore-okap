/** Paramèt pajinasyon pa offset: ?limit=&offset= (bòne pou pa kite yon kliyan mande tout baz la). */
export function parsePage(
  sp: URLSearchParams,
  opts: { defaultLimit: number; maxLimit: number }
): { limit: number; offset: number } {
  const num = (k: string) => {
    const raw = sp.get(k);
    if (raw === null || raw.trim() === "") return NaN;
    return Number(raw);
  };
  const l = num("limit");
  const o = num("offset");
  const limit = Number.isFinite(l) ? Math.min(Math.max(Math.floor(l), 1), opts.maxLimit) : opts.defaultLimit;
  const offset = Number.isFinite(o) ? Math.max(Math.floor(o), 0) : 0;
  return { limit, offset };
}

export function pageMeta(total: number, offset: number, count: number) {
  const next = offset + count;
  return { total, hasMore: next < total, nextOffset: next < total ? next : null };
}
