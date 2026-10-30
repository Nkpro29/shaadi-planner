import { Suspense } from "react";
import { EventsPage } from "@/components/events-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <EventsPage />
    </Suspense>
  );
}
