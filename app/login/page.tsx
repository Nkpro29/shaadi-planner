import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/auth/constants";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  if (user) redirect(nextPath);
  return <LoginForm nextPath={nextPath} />;
}
