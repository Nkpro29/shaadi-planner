"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function buttonClass(variant: "primary" | "secondary" | "ghost" | "danger" = "primary") {
  const styles = {
    primary: "bg-maroon text-ivory hover:bg-maroon-deep",
    secondary: "border border-line bg-white text-ink hover:border-gold",
    ghost: "text-maroon hover:bg-maroon/5",
    danger: "border border-danger/30 bg-white text-danger hover:bg-danger/5",
  }[variant];
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`${buttonClass(variant)} ${className}`} {...props} />;
}

export function ActionLink({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <Link href={href} className={buttonClass(variant)}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-paper p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{eyebrow}</p> : null}
        <h1 className="font-display text-4xl leading-none text-maroon-deep sm:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-3 text-sm leading-6 text-muted sm:text-base">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "maroon" | "gold" | "ok" | "danger" | "sample";
}) {
  const tones = {
    neutral: "border-line bg-ivory text-muted",
    maroon: "border-maroon/15 bg-maroon/10 text-maroon",
    gold: "border-[#e2d0a4] bg-[#f4ead2] text-[#7a5b1e]",
    ok: "border-[#c5e0cf] bg-[#e7f2eb] text-ok",
    danger: "border-[#efd0cc] bg-[#f8ebe9] text-danger",
    sample: "border-gold-soft bg-white text-gold",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): "neutral" | "gold" | "ok" | "danger" | "maroon" {
  if (["completed", "purchased", "delivered", "given", "ready", "done", "coming", "approved", "packed", "confirmed"].includes(status)) {
    return "ok";
  }
  if (["in_progress", "shortlisted", "packaging_pending", "review", "waiting", "maybe", "sent"].includes(status)) {
    return "gold";
  }
  if (["cancelled", "not_coming", "high", "declined"].includes(status)) return "danger";
  if (status === "medium") return "gold";
  return "neutral";
}

export function SampleTag({ show }: { show: boolean }) {
  if (!show) return null;
  return <Badge tone="sample">Sample</Badge>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-10 text-center">
      <h3 className="font-display text-3xl text-maroon-deep">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="h-full rounded-2xl border border-line bg-paper px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold leading-none tabular-nums text-maroon-deep">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-paper shadow-xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-3xl text-maroon-deep">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-ivory">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-6 text-ink">{body}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<null | { title: string; body: string; confirmLabel?: string; onConfirm: () => void }>(
    null,
  );
  const ask = (title: string, body: string, onConfirm: () => void, confirmLabel?: string) =>
    setPending({ title, body, onConfirm, confirmLabel });
  const dialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      body={pending.body}
      confirmLabel={pending.confirmLabel}
      onClose={() => setPending(null)}
      onConfirm={() => {
        pending.onConfirm();
        setPending(null);
      }}
    />
  ) : null;
  return { ask, dialog };
}

export function PageFallback() {
  return <p className="text-sm text-muted">Loading this page…</p>;
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="rounded-xl bg-[#f8ebe9] px-3 py-2 text-sm text-danger">{message}</p>;
}

export function FormActions({ onClose, saveLabel = "Save", disabled = false }: { onClose: () => void; saveLabel?: string; disabled?: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-line bg-paper px-5 py-3">
      <Button type="submit" disabled={disabled}>{saveLabel}</Button>
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}
