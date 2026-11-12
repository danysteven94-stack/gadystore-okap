export const metadata = { title: "Kondisyon Itilizasyon / Terms of Use" };
const SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "danystevenj@gmail.com";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-10 pt-[calc(2.5rem+env(safe-area-inset-top))] space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Kondisyon Itilizasyon / Terms of Use</h1>
      <p>Kont yo kreye pa administratè a. Ou responsab konfidansyalite modpas ou ak done ou antre yo. Abònman an peye dirèkteman bay pwopriyetè sèvis la (deyò app la). N ap fè sa nou kapab pou sèvis la disponib, men nou pa garanti li pap janm entèwonp.</p>
      <p>Accounts are created by an administrator. You are responsible for your password and the data you enter. Subscriptions are billed directly by the service owner outside the app. We aim for continuous availability but do not guarantee uninterrupted service.</p>
      <p>Kontak / Contact: <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a></p>
    </main>
  );
}
