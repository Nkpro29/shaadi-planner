import { NextResponse } from "next/server";
import { AuthError } from "./store";

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: { "Cache-Control": "no-store" } });
}

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function textField(value: unknown) {
  return typeof value === "string" ? value : "";
}
