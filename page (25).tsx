import { CheckCircle2, XCircle } from "lucide-react";
import { redis } from "@/lib/upstash";
import type { Business, Sale } from "@/types";

interface Props {
  params: Promise<{ saleId: string }>;
}

function fmt(n: number) {
  return `${n.toLocaleString("fr-FR")} G`;
}

export default async function VerifyPage({ params }: Props) {
  const { saleId } = await params;
  const sale = await redis.hgetall<Sale>(`sale:${saleId}`);
  const business = sale
    ? await redis.hgetall<Business>(`business:${sale.businessId}`)
    : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm bg-white dark:bg-dark-surface border border-ink/10 dark:border-dark-border rounded-card p-8 text-center">
        {sale && business ? (
          <>
            <CheckCircle2 size={40} className="mx-auto text-forest mb-3" />
            <h1 className="font-display text-lg mb-1">Fakti Otantik</h1>
            <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
              Fakti sa a verifye epi li soti nan {business.name}.
            </p>
            <div className="text-left text-sm space-y-2 border-t border-ink/10 dark:border-dark-border pt-4">
              <div className="flex justify-between">
                <span className="text-ink/50 dark:text-paper/50">Nimewo</span>
                <span className="stat-figure">{sale.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50 dark:text-paper/50">Dat</span>
                <span>{new Date(sale.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="stat-figure">
                  {fmt(sale.total)} {business.currency}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <XCircle size={40} className="mx-auto text-brick mb-3" />
            <h1 className="font-display text-lg mb-1">Fakti Pa Jwenn</h1>
            <p className="text-sm text-ink/60 dark:text-paper/60">
              Nou pa ka verifye fakti sa a. Li ka efase oswa lyen an pa kòrèk.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
