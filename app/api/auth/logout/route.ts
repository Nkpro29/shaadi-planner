import { jsonError, jsonOk } from "@/lib/auth/http";
import { clearSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await clearSession(request);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
