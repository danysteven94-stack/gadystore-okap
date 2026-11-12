import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Kenbe pou konpatibilite: "gold" kounye a make chif la an rouj */
  tone?: "white" | "gold";
  /** Kat enfòmasyon prensipal la (pwofi net): fon nwa */
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, tone = "white", accent }: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-card border p-3.5 sm:p-4 ${
        accent
          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
          : "border-line bg-white dark:border-dark-border dark:bg-dark-surface"
      }`}
    >
      {Icon && (
        <Icon
          size={22}
          strokeWidth={1.75}
          className={`shrink-0 ${accent ? "text-white dark:text-brick" : "text-brick"}`}
        />
      )}
      <div className="min-w-0">
        <p
          className={`text-[13px] leading-tight ${
            accent ? "text-white/70 dark:text-ink/60" : "text-ink/60 dark:text-white/60"
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-0.5 whitespace-nowrap text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${
            accent
              ? "text-white dark:text-ink"
              : tone === "gold"
              ? "text-brick"
              : "text-ink dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
