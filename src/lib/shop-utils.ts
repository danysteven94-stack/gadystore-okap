// Fonksyon pi yo (san Redis) pou boutik piblik la — itilize sou sèvè ak navigatè a.

export type DeliveryMethod = "delivery" | "pickup";
export type PayMethod = "cash_delivery" | "moncash" | "natcash" | "transfer";
export type Fulfillment = "new" | "preparing" | "shipped" | "delivered";

export const PAY_LABEL: Record<PayMethod, string> = {
  cash_delivery: "Kach lè m resevwa",
  moncash: "MonCash",
  natcash: "NatCash",
  transfer: "Transfè bank",
};

export const FULFILLMENT_LABEL: Record<Fulfillment | "cancelled", string> = {
  new: "Kòmand resevwa",
  preparing: "Ap prepare",
  shipped: "Nan wout",
  delivered: "Livre",
  cancelled: "Anile",
};

export function deliveryFeeFor(
  cfg: { deliveryFee: number; freeDeliveryMin: number },
  subtotal: number,
  method: DeliveryMethod
): number {
  if (method === "pickup") return 0;
  if (cfg.freeDeliveryMin > 0 && subtotal >= cfg.freeDeliveryMin) return 0;
  return Math.max(0, cfg.deliveryFee || 0);
}

/** Kle yon liy panye: pwodwi + gwosè + koulè */
export function lineKey(productId: string, size?: string | null, color?: string | null) {
  return [productId, size || "", color || ""].join("|");
}

export function parseLineKey(key: string) {
  const [productId, size, color] = key.split("|");
  return { productId, size: size || "", color: color || "" };
}

export function variantLabel(size?: string | null, color?: string | null) {
  return [size, color].filter(Boolean).join(" / ");
}

/** Konpare de nimewo telefòn pa 8 dènye chif yo (kòd peyi ka diferan) */
export function samePhone(a: string, b: string) {
  const x = (a || "").replace(/\D/g, "").slice(-8);
  const y = (b || "").replace(/\D/g, "").slice(-8);
  return x.length >= 7 && x === y;
}

export function discountPct(price: number, oldPrice: number | null | undefined) {
  if (!oldPrice || oldPrice <= price || price <= 0) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
