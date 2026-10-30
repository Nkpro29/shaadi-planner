import { Suspense } from "react";
import { ShoppingPage } from "@/components/shopping-page";
import { PageFallback } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ShoppingPage />
    </Suspense>
  );
}
