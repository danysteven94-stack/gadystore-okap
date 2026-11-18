"use client";
import { useParams } from "next/navigation";
import { ErrorView } from "@/components/ui/error-view";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { slug } = useParams<{ slug: string }>();
  return <ErrorView error={error} reset={reset} scope="boutik" homeHref={`/boutik/${slug}`} />;
}
