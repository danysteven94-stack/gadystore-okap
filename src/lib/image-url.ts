// Èd pi pou foto yo (san Redis, kidonk fasil pou teste).

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export function parseDataUrl(v: unknown): { contentType: string; buffer: Buffer } | null {
  if (typeof v !== "string") return null;
  const m = v.match(DATA_URL);
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
}

/** Sèlman URL Vercel Blob (https + domèn *.public.blob.vercel-storage.com): evite yon redireksyon ouvè si Redis kontamine. */
export function isTrustedBlobUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function extFor(contentType: string): "jpg" | "png" | "webp" {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}
