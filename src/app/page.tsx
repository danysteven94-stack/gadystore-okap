import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Paj dakèy piblik. Sèlman moun ki deja konekte (gen yon sesyon valid) ale dirèk nan app jesyon an.
// Tout lòt moun wè yon paj nètral epi yo chwazi: konekte (pwopriyetè/anplwaye) — pa gen okenn redireksyon otomatik.
export default async function Home() {
  const token = (await cookies()).get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm text-center bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8">
        <Image src="/logo.png" alt="Platfomnou" width={72} height={72} className="mx-auto mb-4 rounded-2xl" priority />
        <h1 className="text-xl font-semibold mb-1">Platfomnou</h1>
        <p className="text-sm text-ink/60 dark:text-white/60 mb-6">
          Platfòm jesyon pou biznis: vant, stock, kòmand ak fakti.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-card bg-ink text-white dark:bg-white dark:text-ink py-3 text-sm font-medium"
        >
          Konekte (pwopriyetè / anplwaye)
        </Link>
        <p className="text-xs text-ink/40 dark:text-white/40 mt-4">
          Ou se yon kliyan? Itilize lyen boutik la ou te resevwa a.
        </p>
      </div>
    </main>
  );
}
