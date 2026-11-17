interface Props {
  label: string;
  value: string;
  sub: string;
}

export function HeroCard({ label, value, sub }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink text-white p-5 sm:p-6 shadow-card dark:bg-dark-surface dark:border dark:border-dark-border dark:shadow-none">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-brick" />
      <p className="text-sm font-medium text-white/65">{label}</p>
      <p className="stat-figure mt-3 text-4xl sm:text-5xl font-extrabold leading-none">{value}</p>
      <p className="mt-5 flex items-center gap-2 text-sm text-white/60">
        <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-brick" />
        {sub}
      </p>
    </div>
  );
}
