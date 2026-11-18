import { SUPER_ADMIN_EMAIL } from "@/lib/session";

type UserRecord = Record<string, unknown>;

/**
 * Kont "dirèk" kont prensipal la: li menm ki kreye l (oswa kont ansyen ki pa gen `createdBy`).
 * Kont anplwaye yon admin kreye (jesyonè, kesye...) PA dirèk — yo pa parèt sou kont prensipal la.
 */
export function isDirectAccount(record: UserRecord): boolean {
  const createdBy = String(record.createdBy ?? "").trim().toLowerCase();
  return !createdBy || createdBy === SUPER_ADMIN_EMAIL;
}

/** Kont ki peye abònman: admin (pwopriyetè) kont prensipal la kreye dirèkteman. Anplwaye yo pa peye. */
export function isBillableAccount(record: UserRecord): boolean {
  return String(record.role ?? "") === "admin" && isDirectAccount(record);
}

/** Moun ki rele a ka jere (dezaktive/efase/reyinisyalize) kont sa a: se kont prensipal la oswa se li menm ki kreye l. */
export function canManageAccount(callerEmail: string, callerIsSuper: boolean, target: UserRecord): boolean {
  if (callerIsSuper) return true;
  return String(target.createdBy ?? "").trim().toLowerCase() === callerEmail.trim().toLowerCase();
}
