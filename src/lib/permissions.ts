// RBAC pi (san Redis/jose) — fasil pou teste epi pataje ant middleware, API ak UI.
export type UserRole = "admin" | "gestionnaire" | "caissier";

/** Contrôle d'accès basé sur les rôles (RBAC) */
export const permissions: Record<UserRole, string[]> = {
  admin: ["*"],
  // gestionnaire: jere pwodwi/stok; PA jere itilizatè ni backup (sa yo se pou admin ak "*").
  gestionnaire: ["sales:write", "stock:read", "products:write", "invoices:write", "reports:read"],
  // caissier: sèlman vann ak enprime fakti.
  caissier: ["sales:write", "invoices:print"],
};

export function can(role: UserRole, action: string): boolean {
  const allowed = permissions[role];
  if (!allowed) return false; // wòl enkoni → refize
  return allowed.includes("*") || allowed.includes(action);
}

/** Pri nan vant dwe koresponn ak pri pwodwi a sou sèvè a (tolerans santim). */
export function pricesMatch(clientPrice: number, serverPrice: number): boolean {
  return Math.abs(clientPrice - serverPrice) <= 0.005;
}
