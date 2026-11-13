import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-2xl font-semibold mb-2">Pwodwi sa a pa disponib</p>
      <p className="text-sm text-black/60 mb-6">Li ka retire nan boutik la oswa lyen an pa bon.</p>
      <Link href="../../" className="inline-block rounded-xl px-7 py-3.5 font-semibold text-white bg-black">
        Retounen nan boutik la
      </Link>
    </main>
  );
}
