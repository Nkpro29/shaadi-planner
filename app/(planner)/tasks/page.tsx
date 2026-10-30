import { Suspense } from "react";
import { PageFallback } from "@/components/ui";
import { TasksPage } from "@/components/tasks-page";

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TasksPage />
    </Suspense>
  );
}
