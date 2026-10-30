import { Suspense } from "react";
import { BudgetPage } from "@/components/budget-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <BudgetPage />
    </Suspense>
  );
}
