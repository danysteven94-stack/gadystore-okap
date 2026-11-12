import { Building2 } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub: string;
}

export function HeroCard({ label, value, sub }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#4ADE80]/60 bg-gradient-to-br from-[#0A6B1C] via-[#14943A] to-[#0A4F18] p-5 sm:p-6 shadow-[0_0_30px_rgba(34,197,94,0.35)]">
      <Building2
        size={92}
        strokeWidth={1.2}
        className="absolute left-3 bottom-0 text-sky-200/80 drop-shadow-[0_0_14px_rgba(125,211,252,0.5)]"
      />
      <svg
        viewBox="0 0 160 110"
        className="absolute right-3 bottom-3 w-32 sm:w-40 opacity-95"
        aria-hidden
      >
        <defs>
          <linearGradient id="heroBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9F99D" />
            <stop offset="100%" stopColor="#65D12B" />
          </linearGradient>
        </defs>
        <rect x="8" y="78" width="26" height="30" rx="4" fill="url(#heroBar)" />
        <rect x="44" y="62" width="26" height="46" rx="4" fill="url(#heroBar)" />
        <rect x="80" y="44" width="26" height="64" rx="4" fill="url(#heroBar)" />
        <rect x="116" y="26" width="26" height="82" rx="4" fill="url(#heroBar)" />
        <polyline
          points="6,58 48,40 84,30 140,6"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="122,4 142,5 140,24"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative pl-[88px] sm:pl-28">
        <p className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-[#FDE047]">
          {label}
        </p>
        <p className="mt-1 text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
          {value}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-white/95">
          <span className="inline-block h-3 w-3 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80]" />
          {sub}
        </p>
      </div>
    </div>
  );
}
