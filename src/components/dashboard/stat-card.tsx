import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Koulè chif la: blan (default) oswa jòn */
  tone?: "white" | "gold";
  /** Kat vèt (pwofi net) */
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, tone = "white", accent }: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 ${
        accent
          ? "border-[#4ADE80]/70 bg-gradient-to-br from-[#0B6B1E] via-[#0F8A2B] to-[#0A4A18] shadow-[0_0_22px_rgba(34,197,94,0.35)]"
          : "border-[#F5B800]/35 bg-gradient-to-br from-[#0E1B36] to-[#0A1226] shadow-[0_0_16px_rgba(245,184,0,0.12)]"
      }`}
    >
      {Icon && (
        <Icon
          size={32}
          strokeWidth={1.6}
          className="shrink-0 text-[#FFC21A] drop-shadow-[0_0_8px_rgba(255,194,26,0.45)]"
        />
      )}
      <div className="min-w-0">
        <p className="text-[13px] leading-tight text-paper/90">{label}</p>
        <p
          className={`mt-0.5 whitespace-nowrap text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums ${
            accent ? "text-[#B8F53C]" : tone === "gold" ? "text-[#FFC21A]" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
