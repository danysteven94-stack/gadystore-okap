import type { Lang } from "@/lib/i18n/dictionary";

/** Tradiksyon liy-an-liy pou ti paj sekirite yo (evite gwosi dictionary la). */
export function tr(lang: Lang, o: { ht: string; fr: string; en: string }): string {
  return o[lang] ?? o.ht;
}
