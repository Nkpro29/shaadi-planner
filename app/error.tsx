"use client";

import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <h1 className="font-display text-4xl text-maroon-deep">Something went wrong</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message || "The page could not be shown."}</p>
      <div className="mt-4">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
