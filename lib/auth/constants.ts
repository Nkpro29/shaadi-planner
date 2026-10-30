export const OWNER_EMAIL = "tashu.kulshresth@gmail.com";
export const SESSION_COOKIE = "shaadi_session";
export const SESSION_MONTHS = 3;
export const MIN_PASSWORD_LENGTH = 8;

export type UserRole = "owner" | "member";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ManagedUser extends PublicUser {
  createdAt: string;
}

export function sessionExpiry(from = new Date()) {
  const expires = new Date(from.getTime());
  expires.setMonth(expires.getMonth() + SESSION_MONTHS);
  return expires;
}

export function safeNextPath(value: string | null | undefined) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.startsWith("/login")) return "/";
  return value;
}
