import { describe, expect, it } from "vitest";
import { buildMeta, clientIp, diffFields, filterEntries, parseEntries, sanitizeMeta, type AuditEntry } from "@/lib/audit-core";

const e = (o: Partial<AuditEntry>): AuditEntry => ({ id: "1", at: "2026-11-18T10:00:00.000Z", actor: "a@x.com", action: "auth.login", ...o });

describe("sanitizeMeta", () => {
  it("retire chan sekrè yo (nenpòt nivo)", () => {
    const r = sanitizeMeta({ ok: 1, password: "x", newPassword: "y", nested: { token: "t", sessionCookie: "c", keep: "v" }, passwordHash: "h", otpCode: "1" }) as Record<string, unknown>;
    expect(r).toEqual({ ok: 1, nested: { keep: "v" } });
  });
  it("kout tèks long", () => {
    const s = sanitizeMeta("x".repeat(500)) as string;
    expect(s.length).toBe(201);
    expect(s.endsWith("…")).toBe(true);
  });
  it("limite pwofondè ak tab", () => {
    expect(sanitizeMeta({ a: { b: { c: { d: 1 } } } })).toEqual({ a: { b: { c: "[…]" } } });
    expect((sanitizeMeta(Array.from({ length: 50 }, (_, i) => i)) as number[]).length).toBe(20);
  });
});

describe("buildMeta", () => {
  it("undefined si vid", () => {
    expect(buildMeta(undefined)).toBeUndefined();
    expect(buildMeta({})).toBeUndefined();
    expect(buildMeta({ password: "x" })).toBeUndefined();
  });
  it("marke 'truncated' si two gwo", () => {
    const big: Record<string, unknown> = {};
    for (let i = 0; i < 40; i++) big[`k${i}`] = "v".repeat(150);
    expect(buildMeta(big)).toEqual({ truncated: true });
  });
});

describe("diffFields", () => {
  it("sèlman sa ki chanje", () => {
    expect(diffFields({ sellPrice: 100, stock: 5, name: "A" }, { sellPrice: 120, stock: 5, name: "A" }, ["sellPrice", "stock", "name"])).toEqual({
      sellPrice: { from: 100, to: 120 },
    });
  });
  it("konpare kòm tèks ('100' = 100) epi inyore chan ki pa nan after", () => {
    expect(diffFields({ a: "100", b: 1 }, { a: 100 }, ["a", "b"])).toEqual({});
  });
  it("valè ki manke → null", () => {
    expect(diffFields({}, { barcode: "123" }, ["barcode"])).toEqual({ barcode: { from: null, to: "123" } });
  });
});

describe("clientIp", () => {
  it("pran premye IP a", () => expect(clientIp("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7"));
  it("IPv6", () => expect(clientIp("2001:db8::1")).toBe("2001:db8::1"));
  it("rejte valè enjekte", () => {
    expect(clientIp("<script>alert(1)</script>")).toBeUndefined();
    expect(clientIp(null, null)).toBeUndefined();
  });
  it("tonbe sou x-real-ip", () => expect(clientIp(null, "198.51.100.2")).toBe("198.51.100.2"));
});

describe("parseEntries", () => {
  it("li JSON ak objè, sote sa ki kòwonpi", () => {
    const ok = JSON.stringify(e({ id: "a" }));
    expect(parseEntries([ok, "pa json", null, JSON.stringify({ x: 1 }), e({ id: "b" })]).map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("filterEntries", () => {
  const all = [
    e({ id: "1", action: "auth.login", actor: "ana@x.com", at: "2026-11-10T08:00:00Z" }),
    e({ id: "2", action: "product.update", actor: "bob@x.com", at: "2026-11-15T08:00:00Z", target: { type: "product", id: "p1", label: "Sandal Nike" } }),
    e({ id: "3", action: "user.delete", actor: "ana@x.com", at: "2026-11-18T08:00:00Z", ip: "203.0.113.7" }),
  ];
  const ids = (f: Parameters<typeof filterEntries>[1]) => filterEntries(all, f).map((x) => x.id);
  it("pa action egzak", () => expect(ids({ action: "product.update" })).toEqual(["2"]));
  it("pa prefiks", () => expect(ids({ action: "user." })).toEqual(["3"]));
  it("pa actor", () => expect(ids({ actor: "ANA" })).toEqual(["1", "3"]));
  it("pa dat", () => expect(ids({ from: "2026-11-12", to: "2026-11-17" })).toEqual(["2"]));
  it("rechèch lib (label, ip)", () => {
    expect(ids({ q: "nike" })).toEqual(["2"]);
    expect(ids({ q: "203.0.113" })).toEqual(["3"]);
  });
  it("konbine", () => expect(ids({ actor: "ana", action: "auth." })).toEqual(["1"]));
  it("san filt = tout", () => expect(ids({})).toEqual(["1", "2", "3"]));
});
