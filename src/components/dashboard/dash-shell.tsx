export function DashShell({ children }: { children: React.ReactNode }) {
  // Fon blan nan mòd klè, nwa nan mòd fonse. Tèm nan swiv chwa itilizatè a.
  return (
    <div className="min-h-screen bg-white text-ink dark:bg-dark-bg dark:text-white">
      {children}
    </div>
  );
}
