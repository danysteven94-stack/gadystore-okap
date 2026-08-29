"use client";

import { useState } from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import { BusinessSwitcher } from "@/components/dashboard/business-switcher";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BusinessBreakdown } from "@/components/dashboard/business-breakdown";

// Données de démonstration — à remplacer par un appel à /api/dashboard?businessId=
const BUSINESSES = [
  { id: "wholesale", name: "Gwo & Detay", icon: "warehouse" },
  { id: "import", name: "Enpòtasyon Pwodwi", icon: "ship" },
  { id: "food", name: "Manje, Patisri & Gato", icon: "cake" },
  { id: "electronics", name: "Pwodwi Elektwonik", icon: "smartphone" },
  { id: "streaming", name: "Pwodwi Streaming", icon: "streaming" },
];

const STATS: Record<
  string,
  {
    revenue: number;
    sales: number;
    expense: number;
    profit: number;
    lowStock: { name: string; note: string }[];
    recent: { label: string; amount: string; time: string }[];
    topProducts: { name: string; qty: string; revenue: string }[];
    weekly: { date: string; revenue: number; profit: number }[];
  }
> = {
  wholesale: {
    revenue: 34200,
    sales: 58,
    expense: 11000,
    profit: 23200,
    lowStock: [
      { name: "Sak diri 25lb", note: "6 rete" },
      { name: "Konsèv tomat", note: "9 rete" },
    ],
    recent: [
      { label: "Kliyan detay — panye gwo", amount: "2 400 G", time: "14:10" },
      { label: "Revandè — 10 sak diri", amount: "8 500 G", time: "11:20" },
      { label: "Kliyan detay — luil", amount: "660 G", time: "10:05" },
    ],
    topProducts: [
      { name: "Sak diri 25lb", qty: "41 vandi", revenue: "8 200 G" },
      { name: "Luil kwit galon", qty: "33 vandi", revenue: "6 600 G" },
      { name: "Farin", qty: "29 vandi", revenue: "4 350 G" },
    ],
    weekly: [
      { date: "Lin", revenue: 28500, profit: 19000 },
      { date: "Mad", revenue: 31000, profit: 20500 },
      { date: "Mèk", revenue: 26800, profit: 17700 },
      { date: "Jed", revenue: 33200, profit: 22100 },
      { date: "Van", revenue: 36500, profit: 24300 },
      { date: "Sam", revenue: 39800, profit: 26200 },
      { date: "Dim", revenue: 34200, profit: 23200 },
    ],
  },
  import: {
    revenue: 41500,
    sales: 6,
    expense: 22000,
    profit: 19500,
    lowStock: [{ name: "Pyès rechany oto", note: "3 rete" }],
    recent: [
      { label: "Kontenè miks — lo A", amount: "28 000 G", time: "09:30" },
      { label: "Revandè — pyès oto", amount: "9 800 G", time: "08:50" },
      { label: "Vant detay — twal", amount: "3 700 G", time: "08:15" },
    ],
    topProducts: [
      { name: "Kontenè miks — lo A", qty: "2 vandi", revenue: "28 000 G" },
      { name: "Pyès rechany oto", qty: "14 vandi", revenue: "9 800 G" },
      { name: "Twal ang gwo", qty: "1 vandi", revenue: "3 700 G" },
    ],
    weekly: [
      { date: "Lin", revenue: 18000, profit: 8500 },
      { date: "Mad", revenue: 52000, profit: 24000 },
      { date: "Mèk", revenue: 9000, profit: 4200 },
      { date: "Jed", revenue: 31000, profit: 14500 },
      { date: "Van", revenue: 46000, profit: 21800 },
      { date: "Sam", revenue: 12000, profit: 5600 },
      { date: "Dim", revenue: 41500, profit: 19500 },
    ],
  },
  food: {
    revenue: 15680,
    sales: 92,
    expense: 4200,
    profit: 11480,
    lowStock: [
      { name: "Farin patisri", note: "4 sak rete" },
      { name: "Bè", note: "5 liv rete" },
      { name: "Zèf (douzèn)", note: "2 douzèn rete" },
    ],
    recent: [
      { label: "Kliyan — gato chokola", amount: "450 G", time: "16:20" },
      { label: "Kòmand — 2 douz. bonbon", amount: "480 G", time: "15:40" },
      { label: "Kliyan — pen patat", amount: "120 G", time: "15:05" },
    ],
    topProducts: [
      { name: "Gato chokola (pòsyon)", qty: "36 vandi", revenue: "5 400 G" },
      { name: "Pen patat", qty: "28 vandi", revenue: "3 360 G" },
      { name: "Bonbon siwo", qty: "44 vandi", revenue: "2 640 G" },
    ],
    weekly: [
      { date: "Lin", revenue: 11200, profit: 7900 },
      { date: "Mad", revenue: 12800, profit: 9100 },
      { date: "Mèk", revenue: 10500, profit: 7300 },
      { date: "Jed", revenue: 13900, profit: 9800 },
      { date: "Van", revenue: 16200, profit: 11600 },
      { date: "Sam", revenue: 18400, profit: 13200 },
      { date: "Dim", revenue: 15680, profit: 11480 },
    ],
  },
  electronics: {
    revenue: 22900,
    sales: 11,
    expense: 9800,
    profit: 13100,
    lowStock: [
      { name: "Kab USB-C", note: "7 rete" },
      { name: "Ekoutè bluetooth", note: "2 rete" },
    ],
    recent: [
      { label: "Kliyan — pawòl bwat", amount: "1 300 G", time: "13:45" },
      { label: "Kliyan — ekoutè bluetooth", amount: "700 G", time: "12:30" },
      { label: "Kliyan — 3 chaje telefòn", amount: "600 G", time: "11:10" },
    ],
    topProducts: [
      { name: "Ekoutè bluetooth", qty: "9 vandi", revenue: "6 300 G" },
      { name: "Chaje telefòn", qty: "18 vandi", revenue: "3 600 G" },
      { name: "Pawòl bwat (speaker)", qty: "4 vandi", revenue: "5 200 G" },
    ],
    weekly: [
      { date: "Lin", revenue: 17000, profit: 9500 },
      { date: "Mad", revenue: 19500, profit: 11000 },
      { date: "Mèk", revenue: 15800, profit: 8900 },
      { date: "Jed", revenue: 21000, profit: 11900 },
      { date: "Van", revenue: 24500, profit: 14000 },
      { date: "Sam", revenue: 27800, profit: 15800 },
      { date: "Dim", revenue: 22900, profit: 13100 },
    ],
  },
  streaming: {
    revenue: 9790,
    sales: 87,
    expense: 1300,
    profit: 8490,
    lowStock: [],
    recent: [
      { label: "Abònman 1-mwa", amount: "100 G", time: "17:02" },
      { label: "Abònman 3-mwa", amount: "270 G", time: "16:48" },
      { label: "Kont fanmi", amount: "180 G", time: "16:20" },
    ],
    topProducts: [
      { name: "Abònman 1-mwa", qty: "52 vandi", revenue: "5 200 G" },
      { name: "Abònman 3-mwa", qty: "21 vandi", revenue: "3 150 G" },
      { name: "Kont fanmi", qty: "14 vandi", revenue: "1 440 G" },
    ],
    weekly: [
      { date: "Lin", revenue: 7800, profit: 6800 },
      { date: "Mad", revenue: 8400, profit: 7300 },
      { date: "Mèk", revenue: 7100, profit: 6100 },
      { date: "Jed", revenue: 8900, profit: 7700 },
      { date: "Van", revenue: 9600, profit: 8300 },
      { date: "Sam", revenue: 10800, profit: 9400 },
      { date: "Dim", revenue: 9790, profit: 8490 },
    ],
  },
};

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default function DashboardPage() {
  const [activeId, setActiveId] = useState("all");

  const empireRevenue = Object.values(STATS).reduce((s, b) => s + b.revenue, 0);
  const empireProfit = Object.values(STATS).reduce((s, b) => s + b.profit, 0);

  if (activeId === "all") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <BusinessSwitcher
          businesses={BUSINESSES}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <div className="mt-6 mb-6 rounded-card p-5 bg-gradient-to-br from-forest to-forest-light text-paper">
          <p className="text-xs uppercase tracking-wide text-gold-light mb-2">
            Tout Antrepriz — Jodi a
          </p>
          <p className="font-display text-2xl mb-3">{fmt(empireRevenue)}</p>
          <p className="text-sm">
            Pwofi net:{" "}
            <span className="stat-figure font-medium">{fmt(empireProfit)}</span>{" "}
            <span className="opacity-60">· 5 antrepriz aktif</span>
          </p>
        </div>

        <h2 className="font-display text-base mb-2">Repartisyon pa antrepriz</h2>
        <BusinessBreakdown
          businesses={BUSINESSES.map((b) => ({
            id: b.id,
            name: b.name,
            revenue: STATS[b.id].revenue,
          }))}
        />
      </main>
    );
  }

  const stats = STATS[activeId];
  const activeBusiness = BUSINESSES.find((b) => b.id === activeId)!;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <BusinessSwitcher
        businesses={BUSINESSES}
        activeId={activeId}
        onSelect={setActiveId}
      />

      <div className="flex items-baseline justify-between mt-6 mb-4">
        <h1 className="font-display text-xl">{activeBusiness.name}</h1>
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Chif afè jodi a" value={fmt(stats.revenue)} />
        <StatCard label="Vant" value={String(stats.sales)} />
        <StatCard label="Depans" value={fmt(stats.expense)} />
        <StatCard label="Pwofi net" value={fmt(stats.profit)} accent />
      </div>

      <div className="mb-8">
        <RevenueChart data={stats.weekly} />
      </div>

      <section className="mb-8">
        <h2 className="font-display text-base mb-2 flex items-center gap-2">
          <Trophy size={16} className="text-gold-dark" /> Pi bon pwodwi
        </h2>
        <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
          {stats.topProducts.map((p, i) => (
            <div
              key={p.name}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span>
                {i + 1}. {p.name}
              </span>
              <span className="text-right">
                <span className="stat-figure block font-medium">{p.revenue}</span>
                <span className="block text-xs text-ink/40 dark:text-paper/40">{p.qty}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-base">Stok fèb</h2>
          {stats.lowStock.length > 0 && (
            <span className="text-xs text-brick">{stats.lowStock.length} atik</span>
          )}
        </div>
        <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-paper/40 text-center py-6">Tout stok anfòm.</p>
          ) : (
            stats.lowStock.map((item, i) => (
              <div
                key={item.name}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-gold-dark" />
                  {item.name}
                </span>
                <span className="text-ink/50 dark:text-paper/50 text-xs">{item.note}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-base mb-2">Dènye vant</h2>
        <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
          {stats.recent.map((sale, i) => (
            <div
              key={sale.label}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""
              }`}
            >
              <span>{sale.label}</span>
              <span className="text-right">
                <span className="stat-figure block font-medium">
                  {sale.amount}
                </span>
                <span className="block text-xs text-ink/40 dark:text-paper/40">{sale.time}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
