"use client";
import { ErrorView } from "@/components/ui/error-view";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} scope="dashboard" homeHref="/dashboard" />;
}
