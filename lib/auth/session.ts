import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionExpiry, type PublicUser } from "./constants";
import { AuthError, createSession, revokeSession, userForSession } from "./store";
import { authSecret, requestIsSecure, sessionCookieOptions, signSessionToken, verifySessionToken, type SessionClaims } from "./token";

export async function readClaims(): Promise<SessionClaims | null> {
  const secret = authSecret();
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, secret);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const claims = await readClaims();
  if (!claims) return null;
  const user = await userForSession(claims.sid, claims.uid);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in.", 401);
  if (user.role !== "owner") throw new AuthError("Only the owner can manage users.", 403);
  return user;
}

export async function issueSession(user: PublicUser, request: Request) {
  const secret = authSecret();
  if (!secret) throw new AuthError("Sign-in is not configured yet.", 500);
  const expires = sessionExpiry();
  const sid = await createSession(user.id, expires);
  const token = await signSessionToken({ sid, uid: user.id, role: user.role, exp: expires.getTime() }, secret);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expires, requestIsSecure(request)));
  return expires;
}

export async function clearSession(request: Request) {
  const claims = await readClaims();
  if (claims) await revokeSession(claims.sid);
  (await cookies()).set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(new Date(0), requestIsSecure(request)),
    maxAge: 0,
  });
}
