import { expect, test } from "@playwright/test";

// Fikse lang nan kreyòl anvan chak paj (menm kle ak LanguageProvider).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("gadys-lang", "ht"));
});

test.describe("paj piblik", () => {
  test("login: fòm, chan yo ak lyen 'Mo de pas bliye'", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test("forgot-password: fòm imèl la afiche", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test("reset-password san token: mesaj 'lyen pa valid' + bouton nouvo lyen", async ({ page }) => {
    await page.goto("/reset-password");
    // Next.js gen deja yon <div role="alert"> pou anons wout yo: nou vize <p> nou an sèlman.
    await expect(page.locator("p[role=alert]")).toContainText("Lyen an pa valid");
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test("zoom pa bloke (aksesibilite WCAG 1.4.4)", async ({ page }) => {
    await page.goto("/login");
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
    expect(content).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/i);
  });

  test("lang HTML swiv lang itilizatè a (ht)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "ht");
  });

  test("paj ki pa egziste bay 404", async ({ page }) => {
    const res = await page.goto("/sa-pa-egziste-xyz");
    expect(res?.status()).toBe(404);
  });
});

test.describe("sekirite", () => {
  for (const path of ["/dashboard", "/security", "/audit", "/users", "/backup", "/pos"]) {
    test(`${path} san sesyon voye sou /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("headers sekirite prezan", async ({ request }) => {
    const res = await request.get("/login");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("kookie 2FA a pa bay aksè: /api/auth/2fa san sesyon = 401", async ({ request }) => {
    expect((await request.get("/api/auth/2fa")).status()).toBe(401);
    expect((await request.post("/api/auth/2fa", { data: { action: "setup" } })).status()).toBe(401);
  });

  test("jounal odit pa aksesib san sesyon: /api/audit = 401", async ({ request }) => {
    expect((await request.get("/api/audit")).status()).toBe(401);
  });

  test("2FA verify san token MFA = 401 (pa gen sesyon san modpas)", async ({ request }) => {
    const res = await request.post("/api/auth/2fa/verify", { data: { code: "123456" } });
    // 401 (pa gen token) — oswa 429/500 si Redis pa disponib nan CI, men JANM 200.
    expect(res.status()).not.toBe(200);
    expect(res.headers()["set-cookie"] ?? "").not.toContain("session=");
  });
});
