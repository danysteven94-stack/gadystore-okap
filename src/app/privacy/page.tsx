export const metadata = { title: "Politik Konfidansyalite / Privacy Policy" };
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "danystevenj@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-10 pt-[calc(2.5rem+env(safe-area-inset-top))] space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Politik Konfidansyalite</h1>
      <p className="opacity-60">Dènye mizajou / Last updated: 12/11/2026</p>

      <h2 className="font-semibold text-base pt-2">Kreyòl</h2>
      <p><b>Ki done n kolekte:</b> imèl, non, wòl itilizatè; done biznis ou antre (pwodwi, kliyan, founisè, vant, depans, foto pwodwi); dènye koneksyon. Kamera a itilize sèlman pou eskane kòd-baf epi foto pa janm voye san ou pa chwazi l.</p>
      <p><b>Poukisa:</b> pou fè app la mache (jesyon vant, stok, faktiti, rapò) epi sekirize kont ou.</p>
      <p><b>Kote done yo estoke:</b> sèvè Upstash (Redis) ak Vercel. Nou pa vann done ou, nou pa fè piblisite, e nou pa itilize tracker twazyèm pati.</p>
      <p><b>Kliyan boutik piblik la:</b> non, telefòn ak adrès yo voye lè yo fè yon kòmand, epi se pwopriyetè boutik la ki wè yo.</p>
      <p><b>Dwa ou:</b> ou ka efase kont ou nan <a className="underline" href="/account-deletion">/account-deletion</a> oswa mande nou yon kopi done ou: <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.</p>

      <h2 className="font-semibold text-base pt-2">English</h2>
      <p><b>Data we collect:</b> email, name, user role; business data you enter (products, customers, suppliers, sales, expenses, product photos); last login time. The camera is used only to scan barcodes; photos are uploaded only when you select them.</p>
      <p><b>Why:</b> to operate the app (sales, stock, invoices, reports) and secure your account.</p>
      <p><b>Storage:</b> Upstash (Redis) and Vercel servers. We do not sell your data, show ads, or use third-party trackers.</p>
      <p><b>Public shop customers:</b> name, phone and address submitted with an order are visible to the shop owner.</p>
      <p><b>Your rights:</b> delete your account at <a className="underline" href="/account-deletion">/account-deletion</a> or request a copy of your data at <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.</p>
    </main>
  );
}
