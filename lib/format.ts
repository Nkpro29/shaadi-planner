export function uid() {
  return crypto.randomUUID();
}

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function startOfWeek(iso: string) {
  const date = parseISODate(iso);
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return toISODate(date);
}

export function monthGrid(cursor: string) {
  const date = parseISODate(cursor);
  const first = toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function daysUntil(target: string, today: string) {
  if (!target) return null;
  const start = parseISODate(today).getTime();
  const end = parseISODate(target).getTime();
  return Math.round((end - start) / 86400000);
}

export function formatIN(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

export function formatLongDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseISODate(iso));
}

export function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(parseISODate(iso));
}

export function formatTime(value: string) {
  if (!value) return "";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatWhen(date: string, start = "", end = "") {
  const parts = [formatIN(date)];
  if (start) parts.push(formatTime(start));
  if (end) parts.push(`to ${formatTime(end)}`);
  return parts.join(" · ");
}

export function deadlineLabel(date: string, today: string) {
  if (!date) return "No date";
  if (date < today) return `Overdue · ${formatIN(date)}`;
  if (date === today) return `Today · ${formatIN(date)}`;
  if (date === addDays(today, 1)) return `Tomorrow · ${formatIN(date)}`;
  return formatIN(date);
}

export function formatINR(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function moneyOrBlank(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

export function parseMoney(raw: string) {
  const text = raw.trim().replace(/[₹,\s]/g, "");
  if (!text) return { ok: true as const, value: null };
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false as const, value: null };
  }
  return { ok: true as const, value: Math.round(amount * 100) / 100 };
}

export function parseCount(raw: string, fallback: number | null = null) {
  const text = raw.trim();
  if (!text) return { ok: true as const, value: fallback };
  const amount = Number(text);
  if (!Number.isInteger(amount) || amount < 0) {
    return { ok: false as const, value: null };
  }
  return { ok: true as const, value: amount };
}

export function sameMonth(iso: string, cursor: string) {
  return iso.slice(0, 7) === cursor.slice(0, 7);
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
