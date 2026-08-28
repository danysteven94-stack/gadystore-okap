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
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
            activeId === "all"
              ? "bg-ink text-paper border-ink"
              : "bg-transparent text-ink/70 dark:text-paper/70 border-ink/15 dark:border-dark-border hover:border-ink/30"
          }`}
        >
          <LayoutGrid size={16} strokeWidth={1.75} />
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
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
              active
                ? "bg-ink text-paper border-ink"
                : "bg-transparent text-ink/70 dark:text-paper/70 border-ink/15 dark:border-dark-border hover:border-ink/30"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} />
            {b.name}
          </button>
        );
      })}
    </div>
  );
}
