import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { redis } from "@/lib/upstash";
import { extFor, isTrustedBlobUrl, parseDataUrl } from "@/lib/image-url";

/**
 * Estokaj foto yo.
 *  - Si BLOB_READ_WRITE_TOKEN defini → fichye a ale sou Vercel Blob (CDN), Redis gen sèlman URL la (~100 o).
 *  - Sinon → konpòtman anvan an (data URL nan Redis), pou pa kase anyen.
 * Nan tou de ka, URL piblik la rete /api/img/{id} (pa gen anyen pou chanje nan pwodwi/boutik ki egziste deja).
 */
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function storeImage(dataUrl: string): Promise<string> {
  const id = randomUUID();
  const parsed = parseDataUrl(dataUrl);
  if (blobEnabled() && parsed) {
    const blob = await put(`img/${id}.${extFor(parsed.contentType)}`, parsed.buffer, {
      access: "public",
      contentType: parsed.contentType,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    await redis.set(`productimg:${id}`, blob.url);
  } else {
    await redis.set(`productimg:${id}`, dataUrl);
  }
  return `/api/img/${id}`;
}

export type StoredImage =
  | { kind: "url"; url: string }
  | { kind: "data"; contentType: string; buffer: Buffer; dataUrl: string };

export async function loadImage(id: string): Promise<StoredImage | null> {
  // `unknown` pou TypeScript pa redui v a "null" apre type guard la.
  const v: unknown = await redis.get<string>(`productimg:${id}`);
  if (isTrustedBlobUrl(v)) return { kind: "url", url: v };
  const parsed = parseDataUrl(v);
  return parsed ? { kind: "data", ...parsed, dataUrl: String(v) } : null;
}
