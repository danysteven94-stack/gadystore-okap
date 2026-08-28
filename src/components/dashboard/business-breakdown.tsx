interface Props {
  businesses: { id: string; name: string; revenue: number }[];
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export function BusinessBreakdown({ businesses }: Props) {
  const total = businesses.reduce((sum, b) => sum + b.revenue, 0);

  return (
    <div className="rounded-card border border-ink/10 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
      {businesses.map((b, i) => {
        const pct = total > 0 ? Math.round((b.revenue / total) * 100) : 0;
        return (
          <div
            key={b.id}
            className={`px-4 py-3 ${i > 0 ? "border-t border-ink/8 dark:border-dark-border/60" : ""}`}
          >
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span>{b.name}</span>
              <span className="stat-figure font-medium">{fmt(b.revenue)}</span>
            </div>
            <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-forest rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
