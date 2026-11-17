import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** "gold" = chif ki mande atansyon (nouvo kòmand, rupture, stok ba): icône an rouj */
  tone?: "white" | "gold";
  /** Kat enfòmasyon prensipal la (pwofi net) */
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, tone = "white", accent }: Props) {
  const attention = tone === "gold";
  return (
    <div
      className={`flex items-center gap-3 rounded-card border p-3.5 sm:p-4 shadow-card dark:shadow-none ${
        accent
          ? "border-brick/25 bg-brick/[0.07] dark:border-brick/40 dark:bg-brick/15"
          : "border-line bg-white dark:border-dark-border dark:bg-dark-surface"
      }`}
    >
      {Icon && (
        <span
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
            accent || attention
              ? "bg-brick text-white"
              : "bg-mist text-ink/70 dark:bg-white/10 dark:text-white/70"
          }`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs leading-tight font-medium text-ink/55 dark:text-white/55">{label}</p>
        <p
          className={`stat-figure mt-1 whitespace-nowrap text-lg sm:text-xl font-bold leading-none ${
            accent ? "text-brick" : "text-ink dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
