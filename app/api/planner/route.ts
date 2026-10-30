import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { jsonError, jsonOk } from "@/lib/auth/http";
import { AuthError } from "@/lib/auth/store";
import { getCurrentUser } from "@/lib/auth/session";
import { normalize } from "@/lib/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "data", "planner.json");

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in.", 401);
  return user;
}

export async function GET() {
  try {
    await requireUser();
    try {
      const raw = await readFile(FILE, "utf8");
      return jsonOk({ state: normalize(JSON.parse(raw)) });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return jsonOk({ state: null });
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireUser();
    let state;
    try {
      const body = await request.json();
      state = normalize(body?.state ?? body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The planner could not be read.";
      throw new AuthError(message, 400);
    }
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(state));
    await rename(tmp, FILE);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
