interface Props {
  label: string;
  value: string;
  accent?: boolean;
}

export function StatCard({ label, value, accent }: Props) {
  return (
    <div
      className={`rounded-card p-4 ${
        accent ? "bg-forest text-paper" : "bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border"
      }`}
    >
      <p
        className={`text-xs mb-1 ${
          accent ? "text-gold-light" : "text-ink/60 dark:text-paper/60"
        }`}
      >
        {label}
      </p>
      <p className="stat-figure text-2xl font-medium">{value}</p>
    </div>
  );
}
