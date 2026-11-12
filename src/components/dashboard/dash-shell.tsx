export function DashShell({ children }: { children: React.ReactNode }) {
  // Klas "dark" fòse tout variant `dark:` yo nan paj la, menm si tèm global la klè.
  return <div className="dark dash-bg min-h-screen text-paper">{children}</div>;
}
