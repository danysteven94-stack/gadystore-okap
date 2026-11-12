"use client";

import {
  Warehouse,
  Ship,
  Cake,
  Smartphone,
  MonitorPlay,
  LayoutGrid,
  Store,
} from "lucide-react";
import type { Business } from "@/types";

const ICONS: Record<string, React.ElementType> = {
  warehouse: Warehouse, // Gwo & Detay
  ship: Ship, // Enpòtasyon
  cake: Cake, // Manje / Patisri / Gato
  smartphone: Smartphone, // Elektwonik
  streaming: MonitorPlay, // Streaming
  all: LayoutGrid, // Vi ansanm (tout antrepriz)
};

const ACTIVE =
  "bg-gradient-to-r from-[#FFC21A] to-[#F5A100] text-night border-transparent shadow-[0_0_18px_rgba(255,194,26,0.35)]";
const INACTIVE =
  "bg-night/60 text-white border-[#F5B800]/50 hover:border-[#F5B800]";

interface Props {
  businesses: Pick<Business, "id" | "name" | "icon">[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Ajoute yon premye tab "Tout Antrepriz" ki montre yon vi ansanm */
  showOverviewTab?: boolean;
}

export function BusinessSwitcher({
  businesses,
  activeId,
  onSelect,
  showOverviewTab = true,
}: Props) {
  return (
    <div
      role="tablist"
      aria-label="Chwazi antrepriz"
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      {showOverviewTab && (
        <button
          role="tab"
          aria-selected={activeId === "all"}
          onClick={() => onSelect("all")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors border ${
            activeId === "all" ? ACTIVE : INACTIVE
          }`}
        >
          <LayoutGrid size={18} strokeWidth={2} />
          Tout Antrepriz
        </button>
      )}
      {businesses.map((b) => {
        const Icon = ICONS[b.icon] ?? Store;
        const active = b.id === activeId;
        return (
          <button
            key={b.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(b.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors border ${
              active ? ACTIVE : INACTIVE
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {b.name}
          </button>
        );
      })}
    </div>
  );
}
