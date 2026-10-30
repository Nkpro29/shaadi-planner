"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";
import { TextField } from "@/components/fields";
import { Badge, Button, Card, FormActions, FormError, Modal, PageHeader, useConfirm } from "@/components/ui";
import type { ManagedUser } from "@/lib/auth/constants";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

function addedOn(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as { error?: string; user?: ManagedUser; users?: ManagedUser[] } | null;
  if (!response.ok) throw new Error(payload?.error || "That could not be saved.");
  return payload;
}

export function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const { ask, dialog } = useConfirm();

  const load = useCallback(async () => {
    setError("");
    try {
      const payload = await send("/api/users", "GET");
      setUsers(payload?.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Access"
        title="Users"
        subtitle="Add people who can open this planner and choose each password yourself. A sign-in lasts 3 months."
        action={<Button onClick={() => setCreating(true)}>Add a user</Button>}
      />
      {notice ? <p className="rounded-xl bg-ivory px-3 py-2 text-sm text-ink">{notice}</p> : null}
      <FormError message={error} />
      <Card>
        {loading ? <p className="text-sm text-muted">Loading users…</p> : null}
        {!loading && users.length === 0 ? <p className="text-sm text-muted">No sign-ins yet.</p> : null}
        <ul className="divide-y divide-line">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{user.name}</p>
                  <Badge tone={user.role === "owner" ? "maroon" : "neutral"}>{user.role === "owner" ? "You" : "Member"}</Badge>
                </div>
                <p className="truncate text-sm text-muted">{user.email}</p>
                {user.createdAt ? <p className="text-xs text-muted">Added {addedOn(user.createdAt)}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditing(user)}>
                  {user.role === "owner" ? "Change password" : "Edit"}
                </Button>
                {user.role === "member" ? (
                  <Button
                    variant="danger"
                    onClick={() =>
                      ask("Remove this sign-in?", `${user.name} will no longer be able to open the planner.`, () => {
                        void send(`/api/users/${user.id}`, "DELETE")
                          .then(() => {
                            setNotice(`${user.name} was removed.`);
                            return load();
                          })
                          .catch((removeError: unknown) => {
                            setError(removeError instanceof Error ? removeError.message : "Could not remove that user.");
                          });
                      }, "Remove")
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      {creating ? (
        <UserForm
          title="Add a user"
          onClose={() => setCreating(false)}
          onSave={async (input) => {
            await send("/api/users", "POST", input);
            setNotice(`${input.name.trim()} can sign in with the password you set.`);
            setCreating(false);
            await load();
          }}
        />
      ) : null}
      {editing ? (
        <UserForm
          title={editing.role === "owner" ? "Your password" : `Edit ${editing.name}`}
          user={editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await send(`/api/users/${editing.id}`, "PATCH", {
              name: input.name,
              password: input.password || undefined,
            });
            setNotice(
              input.password
                ? editing.role === "owner"
                  ? "Your password was updated. This browser stays signed in."
                  : `${input.name.trim()}'s password was updated. Their other sign-ins were signed out.`
                : `${input.name.trim()} was updated.`,
            );
            setEditing(null);
            await load();
          }}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function UserForm({
  title,
  user,
  onClose,
  onSave,
}: {
  title: string;
  user?: ManagedUser;
  onClose: () => void;
  onSave: (input: { name: string; email: string; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const creating = !user;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if ((creating || user?.role === "owner") && !password) {
      setError("Enter a password.");
      return;
    }
    if (password || confirm) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`);
        return;
      }
      if (password !== confirm) {
        setError("The passwords do not match.");
        return;
      }
    }
    setPending(true);
    setError("");
    try {
      await onSave({ name, email, password });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save that user.");
      setPending(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={(event) => void onSubmit(event)}>
        <div className="space-y-4">
          <FormError message={error} />
          {creating || user?.role === "member" ? (
            <TextField label="Name" value={name} onChange={setName} required />
          ) : (
            <p className="text-sm text-muted">{user?.email}</p>
          )}
          {creating ? <TextField label="Email" value={email} onChange={setEmail} required /> : null}
          <PasswordField
            label={creating ? "Password" : "New password"}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required={creating || user?.role === "owner"}
            hint={
              creating
                ? "Share this password with them yourself. It is not shown again."
                : user?.role === "owner"
                  ? "This browser stays signed in. Other sign-ins for your account are signed out."
                  : "Leave this blank to keep the current password."
            }
          />
          {creating || user?.role === "owner" || password ? (
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              required={creating || user?.role === "owner" || Boolean(password)}
            />
          ) : null}
        </div>
        <FormActions onClose={onClose} disabled={pending} saveLabel={pending ? "Saving…" : creating ? "Add user" : "Save"} />
      </form>
    </Modal>
  );
}
