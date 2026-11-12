interface Props {
  label: string;
  value: string;
  sub: string;
}

export function HeroCard({ label, value, sub }: Props) {
  return (
    <div className="rounded-card border border-line bg-white dark:border-dark-border dark:bg-dark-surface border-l-4 border-l-brick p-5 sm:p-6">
      <p className="text-sm font-medium text-ink/60 dark:text-white/60">{label}</p>
      <p className="stat-figure mt-2 text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-white leading-none">
        {value}
      </p>
      <p className="mt-3 text-sm text-ink/60 dark:text-white/60">{sub}</p>
    </div>
  );
}
