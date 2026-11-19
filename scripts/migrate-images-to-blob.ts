/**
 * Deplase foto ki deja nan Redis (data URL base64) sou Vercel Blob.
 * Li pa chanje okenn URL /api/img/{id}: sèlman valè nan Redis la vin yon ti URL.
 *
 *   Eseye an premye (pa chanje anyen):  npx tsx scripts/migrate-images-to-blob.ts --dry
 *   Vre migrasyon:                      npx tsx scripts/migrate-images-to-blob.ts
 *
 * Bezwen nan .env.local: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, BLOB_READ_WRITE_TOKEN
 * Li ka relanse san danje: foto ki deja migre a (valè = URL) yo sote.
 */
import { config } from "dotenv";
import { Redis } from "@upstash/redis";
import { put } from "@vercel/blob";

config({ path: ".env.local" });

const dry = process.argv.includes("--dry");
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !dry) {
    console.error("BLOB_READ_WRITE_TOKEN manke nan .env.local");
    process.exit(1);
  }
  const redis = Redis.fromEnv();
  let cursor: string | number = 0;
  let migrated = 0, skipped = 0, failed = 0, bytes = 0;

  do {
    const [next, keys]: [string | number, string[]] = await redis.scan(cursor, { match: "productimg:*", count: 100 });
    cursor = next;
    for (const key of keys) {
      const id = key.slice("productimg:".length);
      try {
        const v = await redis.get<string>(key);
        const m = typeof v === "string" ? v.match(DATA_URL) : null;
        if (!m) { skipped++; continue; }
        const buf = Buffer.from(m[2], "base64");
        bytes += buf.length;
        if (dry) { migrated++; continue; }
        const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
        const blob = await put(`img/${id}.${ext}`, buf, {
          access: "public",
          contentType: m[1],
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 31536000,
        });
        await redis.set(key, blob.url); // sèlman apre upload la reyisi
        migrated++;
      } catch (e) {
        failed++;
        console.error("echwe:", key, e instanceof Error ? e.message : e);
      }
    }
  } while (String(cursor) !== "0");

  console.log(`${dry ? "[DRY] " : ""}migre: ${migrated} · sote: ${skipped} · echwe: ${failed} · ${(bytes / 1048576).toFixed(1)} MB`);
}

main();
