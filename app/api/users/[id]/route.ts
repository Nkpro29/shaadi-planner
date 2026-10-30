import { jsonError, jsonOk, readBody, textField } from "@/lib/auth/http";
import { readClaims, requireOwner } from "@/lib/auth/session";
import { AuthError, deleteUser, updateUser } from "@/lib/auth/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOwner();
    const { id } = await context.params;
    const body = await readBody(request);
    const name = typeof body.name === "string" ? body.name : undefined;
    const password = typeof body.password === "string" && body.password ? body.password : undefined;
    if (name === undefined && password === undefined) throw new AuthError("Nothing to update.", 400);
    const claims = await readClaims();
    const user = await updateUser(id, { name, password }, id === actor.id ? claims?.sid : undefined);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await context.params;
    await deleteUser(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
