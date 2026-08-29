/**
 * Kreye premye itilizatè Administrateur Prensipal la.
 *
 * Sèvi ak li: npx tsx scripts/seed-admin.ts admin@gadys.com mopass123
 *
 * (Bezwen UPSTASH_REDIS_REST_URL ak UPSTASH_REDIS_REST_TOKEN nan .env.local)
 */
import { randomUUID } from "crypto";
import { config } from "dotenv";
import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Itilizasyon: npx tsx scripts/seed-admin.ts <imèl> <modpas>");
    process.exit(1);
  }

  const redis = Redis.fromEnv();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: randomUUID(),
    email,
    passwordHash,
    role: "admin",
    businessIds: JSON.stringify([]), // ajoute ID yo apre ou kreye antrepriz yo
  };

  await redis.hset(`user:${email}`, user);

  console.log(`Admin kreye: ${email} (id: ${user.id})`);
  console.log(
    "Lè ou kreye yon antrepriz via /api/businesses, ajoute ID li nan " +
      "\"businessIds\" itilizatè a (hset user:<email> businessIds '[\"<id>\"]') " +
      "pou li ka parèt lè ou konekte."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
