"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/password-field";
import { Button, FormError } from "@/components/ui";
import { Field, inputClass } from "@/components/fields";
import { safeNextPath } from "@/lib/auth/constants";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error || "Could not sign in.");
        setPending(false);
        return;
      }
      window.location.assign(safeNextPath(nextPath));
    } catch {
      setError("Could not sign in.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">ShaadiSaathi</p>
      <h1 className="mt-2 font-display text-5xl text-maroon-deep">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The wedding planner opens after you sign in. A sign-in stays active for 3 months on this browser.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <FormError message={error} />
        <Field label="Email" required>
          <input
            className={inputClass}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
