"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/fields";

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} required={required} hint={hint}>
      <span className="flex gap-2">
        <input
          className={inputClass}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="shrink-0 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          onClick={() => setShow((current) => !current)}
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </Field>
  );
}
