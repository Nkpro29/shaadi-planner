"use client";

import type { ReactNode } from "react";
import { ALTERATION_STATUSES, FAMILY_GROUPS, RELATIONSHIP_SUGGESTIONS } from "@/lib/constants";
import { formatIN } from "@/lib/format";
import type { Person } from "@/lib/types";

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink outline-none ring-maroon/15 placeholder:text-[#b3a89a] focus:border-maroon focus:ring-2";

export function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-maroon"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  className = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <input className={inputClass} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea className={`${inputClass} min-h-24`} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export function DateField({
  label,
  value,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint ?? (value ? `Shown as ${formatIN(value)}` : "Optional. Dates are shown as DD/MM/YYYY.")} className={className}>
      <input type="date" className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input type="time" className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint ?? "Leave blank if you do not know yet."} className={className}>
      <input
        className={inputClass}
        inputMode="decimal"
        placeholder="Amount in INR"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function OptionField<T extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CategoryField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const list = !value || options.includes(value) ? options : [value, ...options];
  return (
    <Field label={label} required>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {list.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function PersonField({
  label,
  people,
  value,
  onChange,
  required,
}: {
  label: string;
  people: Person[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{required ? "Select a person" : "—"}</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} · {person.relationship}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function EventField({
  label,
  events,
  value,
  onChange,
  required,
}: {
  label: string;
  events: { id: string; name: string; date: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{required ? "Select an event" : "—"}</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
            {event.date ? ` · ${formatIN(event.date)}` : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function RelationshipField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Relationship" required hint="You can type your own word, such as Chacha or Mami.">
      <input className={inputClass} list="relationship-suggestions" value={value} onChange={(event) => onChange(event.target.value)} />
      <datalist id="relationship-suggestions">
        {RELATIONSHIP_SUGGESTIONS.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </Field>
  );
}

export function FamilyGroupField({
  value,
  onChange,
}: {
  value: Person["familyGroup"];
  onChange: (value: Person["familyGroup"]) => void;
}) {
  return <OptionField label="Family group" value={value} onChange={onChange} options={FAMILY_GROUPS} />;
}

export function AlterationField({
  value,
  onChange,
}: {
  value: (typeof ALTERATION_STATUSES)[number]["value"];
  onChange: (value: (typeof ALTERATION_STATUSES)[number]["value"]) => void;
}) {
  return <OptionField label="Alteration status" value={value} onChange={onChange} options={ALTERATION_STATUSES} />;
}

export function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex min-h-11 items-start gap-3 py-1 text-sm">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 accent-maroon"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="font-semibold text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-[10rem] flex-1">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {children}
      </select>
    </label>
  );
}
