import { randomInt } from "crypto";

// San karaktè ki ka konfonn (0/O, 1/l/I) — fasil pou li epi dikte nan telefòn.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const ALL = UPPER + LOWER + DIGITS;

/** Modpas tanporè 10 karaktè (ekz: Kx7mQ-p4wRt), ak omwen yon majiskil, yon minis, yon chif. */
export function generateTempPassword(): string {
  for (;;) {
    let out = "";
    for (let i = 0; i < 10; i++) out += ALL[randomInt(ALL.length)];
    if (/[A-Z]/.test(out) && /[a-z]/.test(out) && /[2-9]/.test(out)) {
      return `${out.slice(0, 5)}-${out.slice(5)}`;
    }
  }
}

export function isTrue(v: unknown) {
  return v === true || v === "true";
}
