import { describe, expect, it } from "vitest";
import { extFor, isTrustedBlobUrl, parseDataUrl } from "@/lib/image-url";

describe("parseDataUrl", () => {
  it("li yon JPEG base64", () => {
    const r = parseDataUrl("data:image/jpeg;base64,aGVsbG8=");
    expect(r?.contentType).toBe("image/jpeg");
    expect(r?.buffer.toString()).toBe("hello");
  });
  it("rejte fòma ki pa sipòte oswa piwataj", () => {
    expect(parseDataUrl("data:image/svg+xml;base64,AAAA")).toBeNull();
    expect(parseDataUrl("data:text/html;base64,AAAA")).toBeNull();
    expect(parseDataUrl("https://x.com/a.jpg")).toBeNull();
    expect(parseDataUrl(null)).toBeNull();
    expect(parseDataUrl(42)).toBeNull();
  });
});

describe("isTrustedBlobUrl", () => {
  it("aksepte domèn Vercel Blob la", () =>
    expect(isTrustedBlobUrl("https://abc123.public.blob.vercel-storage.com/img/x.jpg")).toBe(true));
  it("rejte lòt domèn, http ak tronpri", () => {
    expect(isTrustedBlobUrl("http://abc.public.blob.vercel-storage.com/x.jpg")).toBe(false);
    expect(isTrustedBlobUrl("https://evil.com/x.jpg")).toBe(false);
    expect(isTrustedBlobUrl("https://public.blob.vercel-storage.com.evil.com/x.jpg")).toBe(false);
    expect(isTrustedBlobUrl("https://evilpublic.blob.vercel-storage.com.attacker.io/x")).toBe(false);
    expect(isTrustedBlobUrl("javascript:alert(1)")).toBe(false);
    expect(isTrustedBlobUrl("")).toBe(false);
    expect(isTrustedBlobUrl(undefined)).toBe(false);
  });
});

describe("extFor", () => {
  it("chwazi ekstansyon", () => {
    expect(extFor("image/png")).toBe("png");
    expect(extFor("image/webp")).toBe("webp");
    expect(extFor("image/jpeg")).toBe("jpg");
  });
});
