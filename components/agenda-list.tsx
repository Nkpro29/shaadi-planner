"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { formatWhen } from "@/lib/format";
import { agendaHref } from "@/lib/links";
import type { AgendaItem } from "@/lib/types";

export function AgendaList({ items, empty }: { items: AgendaItem[]; empty: string }) {
  if (!items.length) return <p className="text-sm leading-6 text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-semibold text-ink">{item.title}</p>
            <p className="text-sm text-muted">
              {item.label}
              {item.meta ? ` · ${item.meta}` : ""} · {formatWhen(item.date, item.startTime, item.endTime)}
            </p>
          </div>
          <Link href={agendaHref(item)} className={buttonClass("secondary")}>
            Open
          </Link>
        </li>
      ))}
    </ul>
  );
}
