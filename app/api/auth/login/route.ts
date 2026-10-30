import { AuthError, authenticate, normalizeEmail } from "@/lib/auth/store";
import { jsonError, jsonOk, readBody, textField } from "@/lib/auth/http";
import { authSecret } from "@/lib/auth/token";
import { issueSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();

function blocked(email: string) {
  const entry = attempts.get(email);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= 8;
}

function recordFailure(email: string) {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || entry.resetAt < now) {
    attempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

export async function POST(request: Request) {
  try {
    if (!authSecret()) throw new AuthError("Sign-in is not configured yet.", 500);
    const body = await readBody(request);
    const email = normalizeEmail(textField(body.email));
    const password = textField(body.password);
    if (!email || !password) {
      return jsonOk({ error: "Email or password is incorrect." }, 401);
    }
    if (blocked(email)) {
      return jsonOk({ error: "Too many sign-in attempts. Try again in a few minutes." }, 429);
    }
    const user = await authenticate(email, password);
    if (!user) {
      recordFailure(email);
      return jsonOk({ error: "Email or password is incorrect." }, 401);
    }
    attempts.delete(email);
    await issueSession(user, request);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
