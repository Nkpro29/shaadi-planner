import { Suspense } from "react";
import { FamilyPage } from "@/components/family-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <FamilyPage />
    </Suspense>
  );
}
