import { jsonError, jsonOk, readBody, textField } from "@/lib/auth/http";
import { requireOwner } from "@/lib/auth/session";
import { createUser, listUsers } from "@/lib/auth/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    return jsonOk({ users: await listUsers() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = await readBody(request);
    const user = await createUser({
      name: textField(body.name),
      email: textField(body.email),
      password: textField(body.password),
    });
    return jsonOk({ user }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
