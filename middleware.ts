import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { authSecret, verifySessionToken } from "@/lib/auth/token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname === "/api/auth/login") return NextResponse.next();

  const secret = authSecret();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = secret && token ? await verifySessionToken(token, secret) : null;

  if (!claims) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const ownerOnly = pathname === "/users" || pathname.startsWith("/users/") || pathname.startsWith("/api/users");
  if (ownerOnly && claims.role !== "owner") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Only the owner can manage users." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
