"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AgendaList } from "@/components/agenda-list";
import { AreaField, DateField, EventField, FormGrid, OptionField, TextField, TimeField } from "@/components/fields";
import { Button, Card, FormActions, FormError, Modal, PageHeader, useConfirm } from "@/components/ui";
import { CALENDAR_KINDS } from "@/lib/constants";
import { collectAgenda, isPendingPurchase, itemsOnDate, pendingPurchases } from "@/lib/calc";
import { addDays, formatIN, formatLongDate, formatMonth, monthGrid, parseISODate, sameMonth, startOfWeek, toISODate, todayISO, uid } from "@/lib/format";
import { agendaHref } from "@/lib/links";
import { deleteCalendarEntry, saveCalendarEntry } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { AgendaItem, CalendarEntry, CalendarKind, WeddingEvent } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

type View = "month" | "week" | "day" | "agenda";

export function CalendarPage() {
  const planner = useReadyPlanner();
  const today = todayISO();
  const [cursor, setCursor] = useState(today);
  const [view, setView] = useState<View>("month");
  const [creating, setCreating] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEntry | null>(null);
  const { ask, dialog } = useConfirm();
  const ready = Boolean(planner);
  const openEdit = useCallback(
    (id: string) => {
      const entry = planner?.state.calendarEntries.find((item) => item.id === id);
      if (entry) {
        setEditing(entry);
        setCursor(entry.date || today);
      }
    },
    [planner?.state.calendarEntries, today],
  );
  useOpenFromQuery("edit", openEdit, ready);

  const agenda = useMemo(() => (planner ? collectAgenda(planner.state) : []), [planner]);
  if (!planner) return null;
  const { state, update } = planner;
  const overdue = agenda.filter((item) => item.open && item.date < today);
  const todayItems = itemsOnDate(agenda, today);
  const soon = agenda.filter((item) => item.date > today && item.date <= addDays(today, 7));
  const dueShopping = state.purchases.filter((item) => isPendingPurchase(item.status) && item.deadline && item.deadline <= today);
  const undatedEvents = state.events.filter((event) => !event.date && event.status !== "cancelled");
  const undatedTrips = state.trips.filter((trip) => !trip.date);

  function shift(direction: number) {
    if (view === "month") {
      const date = parseISODate(cursor);
      date.setMonth(date.getMonth() + direction);
      setCursor(toISODate(date));
      return;
    }
    setCursor(addDays(cursor, view === "week" ? direction * 7 : direction));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Asia/Kolkata"
        title="Calendar"
        subtitle="Events, task deadlines, shopping trips, fittings, and payment dates show up here from the rest of the planner. Adding or editing them does not make a second copy."
        action={<Button onClick={() => setCreating(cursor)}>Add a calendar entry</Button>}
      />

      <Card>
        <h2 className="font-display text-3xl text-maroon-deep">Today&apos;s plan</h2>
        <p className="mt-1 text-sm text-muted">{formatLongDate(today)}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold">Today</h3>
            <AgendaList items={todayItems} empty="Nothing is dated for today." />
          </section>
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold">Overdue</h3>
            <AgendaList items={overdue} empty="Nothing open is overdue." />
          </section>
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold">Shopping that needs attention</h3>
            {dueShopping.length ? (
              <ul className="divide-y divide-line">
                {dueShopping.map((item) => (
                  <li key={item.id} className="py-2 text-sm">
                    <Link href={`/shopping?edit=${item.id}`} className="font-semibold text-maroon">{item.name}</Link>
                    <p className="text-muted">Deadline {formatIN(item.deadline)} · {item.shop || "Shop not set"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No purchase deadlines are due today or earlier.</p>
            )}
            <p className="mt-2 text-sm text-muted">{pendingPurchases(state).length} purchases are still to buy. Open the shopping list to group them into a trip.</p>
          </section>
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gold">Next 7 days</h3>
            <AgendaList items={soon} empty="Nothing is dated in the next 7 days." />
          </section>
        </div>
        {undatedEvents.length || undatedTrips.length ? (
          <p className="mt-4 text-sm leading-6 text-muted">
            {undatedEvents.length ? `${undatedEvents.length} events have no date. ` : ""}
            {undatedTrips.length ? `${undatedTrips.length} shopping trips have no date. ` : ""}
            They stay on their own pages until you schedule them.
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["month", "week", "day", "agenda"] as View[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={view === item}
                className={`min-h-11 rounded-xl px-4 text-sm font-semibold capitalize ${view === item ? "bg-maroon text-ivory" : "border border-line bg-white"}`}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {view !== "agenda" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => shift(-1)}>Previous</Button>
              <Button variant="secondary" onClick={() => setCursor(today)}>Today</Button>
              <Button variant="secondary" onClick={() => shift(1)}>Next</Button>
            </div>
          ) : null}
        </div>
        <h2 className="mt-4 font-display text-3xl text-maroon-deep">
          {view === "month" ? formatMonth(cursor) : view === "agenda" ? "Coming up" : formatLongDate(view === "week" ? startOfWeek(cursor) : cursor)}
        </h2>
        <div className="mt-4">
          {view === "month" ? <MonthView cursor={cursor} today={today} agenda={agenda} onSelect={(date) => { setCursor(date); setView("day"); }} /> : null}
          {view === "week" ? <WeekView cursor={cursor} today={today} agenda={agenda} /> : null}
          {view === "day" ? <DayView date={cursor} agenda={agenda} onAdd={() => setCreating(cursor)} /> : null}
          {view === "agenda" ? <AgendaView today={today} agenda={agenda} /> : null}
        </div>
      </Card>

      {creating ? (
        <EntryForm
          date={creating}
          events={state.events}
          onClose={() => setCreating(null)}
          onSave={(entry) => update((current) => saveCalendarEntry(current, entry))}
        />
      ) : null}
      {editing ? (
        <EntryForm
          key={editing.id}
          initial={editing}
          events={state.events}
          onClose={() => setEditing(null)}
          onSave={(entry) => update((current) => saveCalendarEntry(current, entry))}
          onDelete={() =>
            ask(`Delete “${editing.title}”?`, "This removes only this calendar entry. Events and tasks are left as they are.", () => {
              update((current) => deleteCalendarEntry(current, editing.id));
              setEditing(null);
            })
          }
        />
      ) : null}
      {dialog}
    </div>
  );
}

function MonthView({
  cursor,
  today,
  agenda,
  onSelect,
}: {
  cursor: string;
  today: string;
  agenda: AgendaItem[];
  onSelect: (date: string) => void;
}) {
  const cells = monthGrid(cursor);
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wide text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const items = itemsOnDate(agenda, date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={`min-h-16 rounded-xl border p-1 text-left sm:min-h-24 sm:p-2 ${date === today ? "border-maroon" : "border-line"} ${sameMonth(date, cursor) ? "bg-white" : "bg-ivory text-muted"}`}
            >
              <span className={`text-xs font-semibold sm:text-sm ${date === today ? "text-maroon" : ""}`}>{Number(date.slice(8))}</span>
              <span className="mt-1 hidden sm:block">
                {items.slice(0, 2).map((item) => (
                  <span key={item.key} className="mt-1 block truncate rounded bg-maroon/10 px-1 text-[11px] text-maroon">{item.title}</span>
                ))}
                {items.length > 2 ? <span className="mt-1 block text-[11px] text-muted">+{items.length - 2} more</span> : null}
              </span>
              {items.length ? <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-maroon sm:hidden" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, today, agenda }: { cursor: string; today: string; agenda: AgendaItem[] }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((date) => (
        <div key={date} className={`rounded-xl border p-2 ${date === today ? "border-maroon bg-white" : "border-line bg-white"}`}>
          <p className="text-xs font-bold text-muted">{formatIN(date)}</p>
          <DayItems items={itemsOnDate(agenda, date)} />
        </div>
      ))}
    </div>
  );
}

function DayView({ date, agenda, onAdd }: { date: string; agenda: AgendaItem[]; onAdd: () => void }) {
  const items = itemsOnDate(agenda, date);
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="secondary" onClick={onAdd}>Add to this day</Button>
      </div>
      <DayItems items={items} />
      {items.length ? null : <p className="text-sm text-muted">Nothing is dated for this day.</p>}
    </div>
  );
}

function AgendaView({ today, agenda }: { today: string; agenda: AgendaItem[] }) {
  const upcoming = agenda.filter((item) => item.date >= today && item.date <= addDays(today, 60));
  const groups = new Map<string, AgendaItem[]>();
  for (const item of upcoming) groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  if (!groups.size) return <p className="text-sm text-muted">Nothing is scheduled in the next 60 days.</p>;
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <h3 className="font-semibold">{formatLongDate(date)}</h3>
          <DayItems items={items} />
        </section>
      ))}
    </div>
  );
}

function DayItems({ items }: { items: AgendaItem[] }) {
  if (!items.length) return <p className="mt-2 text-xs text-muted">—</p>;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item.key}>
          <Link href={agendaHref(item)} className="block rounded-lg bg-ivory px-2 py-1.5 text-sm hover:bg-gold-soft/40">
            <span className="font-semibold">{item.title}</span>
            <span className="mt-0.5 block text-xs text-muted">{item.label}{item.startTime ? ` · ${item.startTime}` : ""}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EntryForm({
  initial,
  date = "",
  events,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: CalendarEntry;
  date?: string;
  events: WeddingEvent[];
  onClose: () => void;
  onSave: (entry: CalendarEntry) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [entryDate, setEntryDate] = useState(initial?.date ?? date);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [kind, setKind] = useState<CalendarKind>(initial?.kind ?? "appointment");
  const [relatedEventId, setRelatedEventId] = useState(initial?.relatedEventId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !entryDate) {
      setError("Add a title and a date.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      title: title.trim(),
      date: entryDate,
      startTime,
      endTime,
      kind,
      notes: notes.trim(),
      relatedEventId,
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit calendar entry" : "Add a calendar entry"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-muted">
          Use this for an appointment or reminder that is not already an event, task, shopping trip, fitting, or expense. Saving it updates this entry only.
        </p>
        <TextField label="Title" required value={title} onChange={setTitle} />
        <FormGrid>
          <DateField label="Date" value={entryDate} onChange={setEntryDate} hint="Required for it to appear on the calendar." />
          <OptionField label="Type" value={kind} onChange={setKind} options={CALENDAR_KINDS} />
          <TimeField label="Start time" value={startTime} onChange={setStartTime} />
          <TimeField label="End time" value={endTime} onChange={setEndTime} />
          <EventField label="Related event" events={events} value={relatedEventId} onChange={setRelatedEventId} />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
        {onDelete ? (
          <button type="button" className="text-sm font-semibold text-danger" onClick={onDelete}>
            Delete this entry
          </button>
        ) : null}
      </form>
    </Modal>
  );
}
