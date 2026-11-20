// Orè restoran an (tèks lib) → orè estriktire. Pati PI, san Redis: fasil pou teste epi sèvi sou sèvè ak kliyan.
// Egzanp ki konprann: "Lendi–Vandredi, 8h–17h", "Lun-Sam 8h30-18h", "Lendi–Vandredi 8h–17h; Samdi 9h–13h",
// "Mon-Fri 8:00-17:00", "24h/24". Si nou pa ka konprann tèks la, boutik la swiv sèlman bouton manyèl la.

export const SHOP_TZ = "America/Port-au-Prince";

export interface HoursSlot {
  days: number[]; // 0 = dimanch … 6 = samdi
  open: number; // minit depi minui
  close: number; // minit depi minui (≤ open = pase minui)
}

const DAY_PATTERNS: [RegExp, number][] = [
  [/^(lendi|lundi|monday|mon|len|lun)$/, 1],
  [/^(madi|mardi|tuesday|tue|tues|mar)$/, 2],
  [/^(mekredi|merkredi|mercredi|wednesday|wed|mer)$/, 3],
  [/^(jedi|jeudi|thursday|thu|thur|thurs|jeu)$/, 4],
  [/^(vandredi|vendredi|friday|fri|van|ven)$/, 5],
  [/^(samdi|samedi|saturday|sat|sam)$/, 6],
  [/^(dimanch|dimanche|sunday|sun|dim)$/, 0],
];

function dayOf(word: string): number | null {
  for (const [re, n] of DAY_PATTERNS) if (re.test(word)) return n;
  return null;
}

function strip(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function toMin(h: string, m: string | undefined, ap: string | undefined): number | null {
  let hh = Number(h);
  const mm = m ? Number(m) : 0;
  if (!isFinite(hh) || mm > 59) return null;
  if (ap === "pm" && hh < 12) hh += 12;
  if (ap === "am" && hh === 12) hh = 0;
  if (hh > 24) return null;
  return hh * 60 + mm;
}

const TIME_RANGE =
  /(\d{1,2})\s*(?:h|:)?\s*(\d{2})?\s*(am|pm)?\s*(?:[-–—]|\s(?:a|au|to|jiska)\s)\s*(\d{1,2})\s*(?:h|:)?\s*(\d{2})?\s*(am|pm)?/;

/** Retounen lis kreno yo, oswa null si tèks la pa konprann (→ pa gen ouvèti otomatik). */
export function parseHours(text: string | null | undefined): HoursSlot[] | null {
  if (!text) return null;
  const raw = strip(text);
  // 24h/24: pa gen lè fèmti → se bouton manyèl la ki deside (nou retounen null)
  if (/24\s*h?\s*\/\s*24|24\s*\/\s*7|24\s*h\s*sur\s*24|tout tan|toujou ouvri/.test(raw)) return null;
  const slots: HoursSlot[] = [];
  for (const seg of raw.split(/[;\n|]+/)) {
    const tm = TIME_RANGE.exec(seg);
    if (!tm) continue;
    const open = toMin(tm[1], tm[2], tm[3]);
    const close = toMin(tm[4], tm[5], tm[6]);
    if (open === null || close === null) continue;

    const dayPart = seg.slice(0, tm.index) + " " + seg.slice(tm.index + tm[0].length);
    const tokens: { n: number; start: number; end: number }[] = [];
    const wordRe = /[a-z]+/g;
    let w: RegExpExecArray | null;
    while ((w = wordRe.exec(dayPart))) {
      const n = dayOf(w[0]);
      if (n !== null) tokens.push({ n, start: w.index, end: w.index + w[0].length });
    }
    const days = new Set<number>();
    if (!tokens.length) for (let d = 0; d < 7; d++) days.add(d);
    for (let i = 0; i < tokens.length; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      const between = b ? dayPart.slice(a.end, b.start) : "";
      if (b && /[-–—]|\b(a|au|to|jiska)\b/.test(between)) {
        for (let d = a.n; ; d = (d + 1) % 7) {
          days.add(d);
          if (d === b.n) break;
        }
        i++; // dezyèm jou a deja konsome
      } else {
        days.add(a.n);
      }
    }
    slots.push({ days: [...days], open, close });
  }
  return slots.length ? slots : null;
}

/** Jou (0-6) ak minit depi minui nan fizo orè Ayiti. */
export function nowInShopTz(date: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day: day < 0 ? 0 : day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Eske nou nan lè ouvèti a? Si pa gen orè ki konprann → true (se bouton manyèl la ki deside). */
export function withinHours(slots: HoursSlot[] | null, date: Date = new Date()): boolean {
  if (!slots) return true;
  const { day, minutes } = nowInShopTz(date);
  const yesterday = (day + 6) % 7;
  for (const s of slots) {
    const allDay = s.open === 0 && s.close === 0;
    const overnight = s.close <= s.open;
    if (s.days.includes(day)) {
      if (allDay) return true;
      if (!overnight && minutes >= s.open && minutes < s.close) return true;
      if (overnight && minutes >= s.open) return true;
    }
    if (overnight && !allDay && s.days.includes(yesterday) && minutes < s.close) return true;
  }
  return false;
}

const WEEK = 7 * 1440;

/**
 * Chanjman manyèl (ouvri/fèmen) la valab sèlman jiska pwochen ouvèti oswa fèmti selon orè a.
 * Apre sa orè a pran men ankò: boutik la ouvri ak fèmen pou kont li, san pèsonn pa bezwen retounen nan paramèt.
 */
function manualOverrideActive(slots: HoursSlot[], manualAtIso: string, now: Date): boolean {
  const at = new Date(manualAtIso);
  if (isNaN(at.getTime())) return false;
  const elapsed = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (elapsed < 0) return true; // revèy ki pa menm — kenbe chanjman an
  if (elapsed > 8 * 1440) return false;
  const { day, minutes } = nowInShopTz(at);
  const atW = day * 1440 + minutes;
  for (const sl of slots) {
    for (const d of sl.days) {
      const overnight = sl.close <= sl.open;
      const bounds = [d * 1440 + sl.open, (overnight ? (d + 1) * 1440 : d * 1440) + sl.close];
      for (const b of bounds) {
        for (let k = 0; k < 3; k++) {
          const t = b + k * WEEK;
          if (t > atW && t <= atW + elapsed) return false; // yon ouvèti/fèmti pase depi chanjman an
        }
      }
    }
  }
  return true;
}

/**
 * Eske boutik la ouvè kounye a?
 * - Si orè a konprann: orè a kontwole OTOMATIKMAN ouvèti a ak fèmti a. Bouton manyèl la (acceptingOrders +
 *   manualAt) se yon chanjman tanporè ki rete valab jiska pwochen ouvèti/fèmti.
 * - Si orè a pa konprann (oswa 24h/24): se sèlman bouton manyèl la ki deside.
 */
export function isShopOpen(
  acceptingOrders: boolean,
  hoursText: string | null | undefined,
  manualAt?: string | null,
  date: Date = new Date()
): boolean {
  const slots = parseHours(hoursText);
  if (!slots) return acceptingOrders;
  if (manualAt && manualOverrideActive(slots, manualAt, date)) return acceptingOrders;
  return withinHours(slots, date);
}
