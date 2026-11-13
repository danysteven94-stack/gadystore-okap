import { createHash } from "crypto";
import { redis } from "@/lib/upstash";
import { userOwnsBusiness } from "@/lib/shop";

/**
 * Push notifikasyon:
 *  - Web Push (VAPID): laptop (Chrome/Edge/Firefox/Safari), Android Chrome, iPhone PWA (ekran dakèy, iOS 16.4+)
 *  - Natif (FCM): app Android/iOS ki soti nan magazen yo (Capacitor + Firebase)
 * Kle Redis: push:web:{email}, push:native:{email}, push:users (imèl ki gen omwen yon abònman).
 */

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}
export interface WebSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const WEB_KEY = (e: string) => `push:web:${e.toLowerCase()}`;
const NATIVE_KEY = (e: string) => `push:native:${e.toLowerCase()}`;
const h = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 24);
const parse = <T,>(v: unknown): T | null => {
  try { return (typeof v === "string" ? JSON.parse(v) : v) as T; } catch { return null; }
};

export async function saveWebSubscription(email: string, sub: WebSubscription) {
  await redis.hset(WEB_KEY(email), { [h(sub.endpoint)]: JSON.stringify(sub) });
  await redis.sadd("push:users", email.toLowerCase());
}
export async function saveNativeToken(email: string, token: string, platform: string) {
  await redis.hset(NATIVE_KEY(email), { [h(token)]: JSON.stringify({ token, platform }) });
  await redis.sadd("push:users", email.toLowerCase());
}
export async function removeSubscription(email: string, opts: { endpoint?: string; token?: string }) {
  if (opts.endpoint) await redis.hdel(WEB_KEY(email), h(opts.endpoint));
  if (opts.token) await redis.hdel(NATIVE_KEY(email), h(opts.token));
  const [w, n] = await Promise.all([redis.hlen(WEB_KEY(email)), redis.hlen(NATIVE_KEY(email))]);
  if (!w && !n) await redis.srem("push:users", email.toLowerCase());
}

// --- Web push ---
let wp: typeof import("web-push") | null | undefined;
async function getWebPush() {
  if (wp !== undefined) return wp;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (wp = null);
  const mod = (await import("web-push")).default;
  mod.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@example.com", pub, priv);
  return (wp = mod);
}

// --- FCM (natif) ---
let fcm: import("firebase-admin").messaging.Messaging | null | undefined;
async function getFcm() {
  if (fcm !== undefined) return fcm;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return (fcm = null);
  try {
    const admin = (await import("firebase-admin")).default;
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return (fcm = admin.messaging());
  } catch (e) {
    console.error("firebase init error", e);
    return (fcm = null);
  }
}

export async function sendToUser(email: string, payload: PushPayload) {
  let web = 0, native = 0;

  const webSubs = await redis.hgetall<Record<string, unknown>>(WEB_KEY(email));
  const push = webSubs && Object.keys(webSubs).length ? await getWebPush() : null;
  if (push && webSubs) {
    await Promise.all(
      Object.entries(webSubs).map(async ([field, raw]) => {
        const sub = parse<WebSubscription>(raw);
        if (!sub?.endpoint) return;
        try {
          await push.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
          web++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await redis.hdel(WEB_KEY(email), field);
        }
      })
    );
  }

  const nativeSubs = await redis.hgetall<Record<string, unknown>>(NATIVE_KEY(email));
  const messaging = nativeSubs && Object.keys(nativeSubs).length ? await getFcm() : null;
  if (messaging && nativeSubs) {
    await Promise.all(
      Object.entries(nativeSubs).map(async ([field, raw]) => {
        const rec = parse<{ token: string }>(raw);
        if (!rec?.token) return;
        try {
          await messaging.send({
            token: rec.token,
            notification: { title: payload.title, body: payload.body },
            data: { url: payload.url || "/dashboard" },
            android: { priority: "high", notification: { sound: "default" } },
            apns: { payload: { aps: { sound: "default" } } },
          });
          native++;
        } catch (e) {
          const code = (e as { code?: string }).code || "";
          if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
            await redis.hdel(NATIVE_KEY(email), field);
          }
        }
      })
    );
  }
  return { web, native };
}

/** Voye bay tout moun ki gen aksè nan antrepriz la (eksepte moun ki fè aksyon an). */
export async function sendPushToBusiness(businessId: string, payload: PushPayload, opts: { excludeEmail?: string } = {}) {
  const emails = await redis.smembers("push:users");
  const exclude = opts.excludeEmail?.toLowerCase();
  const targets: string[] = [];
  for (const email of emails) {
    if (email === exclude) continue;
    if (await redis.sismember("users:disabled", email)) continue;
    if (await userOwnsBusiness(email, businessId)) targets.push(email);
  }
  await Promise.allSettled(targets.map((e) => sendToUser(e, payload)));
}
