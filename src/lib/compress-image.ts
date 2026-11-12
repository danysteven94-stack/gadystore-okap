/**
 * Redwi yon foto (telefòn/galri) a ~900px JPEG anvan voye l — pou kenbe boutik la rapid
 * ak baz done a lejè. Retounen yon data URL.
 */
export async function compressImage(file: File, maxSize = 900, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Foto sa a pa ka li."));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Navigatè a pa sipòte foto.");
    ctx.fillStyle = "#ffffff"; // PNG transparan -> fon blan
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const dataUrl = await compressImage(file);
  const res = await fetch("/api/products/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Pa ka voye foto a.");
  return data.url as string;
}
