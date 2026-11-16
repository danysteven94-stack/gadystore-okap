/** Plan yo (sèlman done, san Redis — ka itilize sou kliyan an tou). */
export type PlanId = "full" | "solo_shop" | "duo";

export interface PlanInfo {
  id: PlanId;
  label: string;
  description: string;
  maxBusinesses: number | null; // null = san limit
  publicShop: boolean;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  full: {
    id: "full",
    label: "Full package",
    description: "Tout fonksyon yo: antrepriz san limit + boutik piblik",
    maxBusinesses: null,
    publicShop: true,
  },
  solo_shop: {
    id: "solo_shop",
    label: "1 antrepriz + boutik piblik",
    description: "1 antrepriz, ak boutik piblik",
    maxBusinesses: 1,
    publicShop: true,
  },
  duo: {
    id: "duo",
    label: "2 antrepriz (san boutik piblik)",
    description: "Jiska 2 antrepriz, pa gen boutik piblik",
    maxBusinesses: 2,
    publicShop: false,
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && (PLAN_IDS as string[]).includes(v);
}

export const NO_SHOP_MESSAGE = "Plan ou a pa gen boutik piblik. Kontakte administratè a pou chanje plan ou.";
export const businessLimitMessage = (max: number) =>
  `Plan ou a pèmèt sèlman ${max} antrepriz. Kontakte administratè a pou chanje plan ou.`;
