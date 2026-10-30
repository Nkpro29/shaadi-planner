import { jsonOk } from "@/lib/auth/http";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonOk({ error: "Please sign in." }, 401);
  return jsonOk({ user });
}
