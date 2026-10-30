import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth/session";
import { CurrentUserProvider } from "@/lib/current-user";
import { StoreProvider } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <CurrentUserProvider user={user}>
      <StoreProvider>
        <Shell>{children}</Shell>
      </StoreProvider>
    </CurrentUserProvider>
  );
}
