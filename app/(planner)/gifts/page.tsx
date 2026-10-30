import { Suspense } from "react";
import { GiftsPage } from "@/components/gifts-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <GiftsPage />
    </Suspense>
  );
}
