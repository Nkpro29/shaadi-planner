import { redirect } from "next/navigation";
import { UsersPage } from "@/components/users-page";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/");
  return <UsersPage />;
}
