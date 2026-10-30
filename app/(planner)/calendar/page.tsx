import { Suspense } from "react";
import { CalendarPage } from "@/components/calendar-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <CalendarPage />
    </Suspense>
  );
}
