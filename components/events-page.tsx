"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaField,
  DateField,
  FormGrid,
  MoneyField,
  OptionField,
  PersonField,
  TextField,
  TimeField,
  inputClass,
} from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, statusTone, useConfirm } from "@/components/ui";
import { EVENT_STATUSES, EVENT_TEMPLATES, labelOf } from "@/lib/constants";
import { eventSpend, personName } from "@/lib/calc";
import { formatIN, formatINR, formatTime, moneyOrBlank, parseCount, parseMoney, uid } from "@/lib/format";
import { deleteEvent, saveEvent, toggleChecklist } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { ChecklistItem, EventStatus, Person, WeddingEvent } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

export function EventsPage() {
  const planner = useReadyPlanner();
  const params = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WeddingEvent | null>(null);
  const [picked, setPicked] = useState<string | null>(params.get("id"));
  const { ask, dialog } = useConfirm();
  const ready = Boolean(planner);
  useOpenFromQuery("new", useCallback((value: string) => {
    if (value === "1") setCreating(true);
  }, []), ready);
  useOpenFromQuery("id", useCallback((id: string) => setPicked(id), []), ready);

  if (!planner) return null;
  const { state, update } = planner;
  const selected = state.events.find((event) => event.id === picked) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Ceremonies"
        title="Events & rituals"
        subtitle="Start from a familiar ceremony, then change the date, checklist, and budget. Nothing here is required."
        action={<Button onClick={() => setCreating(true)}>Add an event</Button>}
      />
      {state.events.length ? (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {state.events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setPicked(event.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${selected?.id === event.id ? "border-maroon bg-white" : "border-line bg-paper"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{event.name}</span>
                  <SampleTag show={event.isSample} />
                </span>
                <span className="mt-1 block text-sm text-muted">{event.date ? formatIN(event.date) : "Date not set"}</span>
              </button>
            ))}
          </div>
          {selected ? (
            <EventDetail
              event={selected}
              tasks={state.tasks.filter((task) => task.eventId === selected.id)}
              purchases={state.purchases.filter((item) => item.eventId === selected.id)}
              spend={eventSpend(state, selected.id)}
              responsible={personName(state, selected.responsiblePersonId)}
              onToggle={(itemId) => update((current) => toggleChecklist(current, selected.id, itemId))}
              onEdit={() => setEditing(selected)}
              onDelete={() =>
                ask(
                  `Remove ${selected.name}?`,
                  "The event and its checklist will be deleted. Tasks, purchases, and expenses stay, but they will no longer be linked to it.",
                  () => {
                    update((current) => deleteEvent(current, selected.id));
                    setPicked(null);
                  },
                )
              }
            />
          ) : (
            <EmptyState title="Choose a ceremony" body="Select an event to see its checklist, tasks, and purchases." />
          )}
        </div>
      ) : (
        <EmptyState title="No events yet" body="Add Mehendi, Haldi, Sangeet, or any gathering your family is planning." action={<Button onClick={() => setCreating(true)}>Add an event</Button>} />
      )}
      {creating ? (
        <EventForm people={state.people} onClose={() => setCreating(false)} onSave={(event) => {
          update((current) => saveEvent(current, event));
          setPicked(event.id);
        }} />
      ) : null}
      {editing ? (
        <EventForm
          key={editing.id}
          initial={editing}
          people={state.people}
          onClose={() => setEditing(null)}
          onSave={(event) => update((current) => saveEvent(current, event))}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function EventDetail({
  event,
  tasks,
  purchases,
  spend,
  responsible,
  onToggle,
  onEdit,
  onDelete,
}: {
  event: WeddingEvent;
  tasks: { id: string; title: string; status: string }[];
  purchases: { id: string; name: string; status: string }[];
  spend: { estimated: number | null; actual: number | null; count: number };
  responsible: string;
  onToggle: (itemId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = event.checklist.filter((item) => item.done).length;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-4xl text-maroon-deep">{event.name}</h2>
            <SampleTag show={event.isSample} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {event.date ? formatIN(event.date) : "Date not set"}
            {event.startTime ? ` · ${formatTime(event.startTime)}` : ""}
            {event.endTime ? ` to ${formatTime(event.endTime)}` : ""}
          </p>
        </div>
        <Badge tone={statusTone(event.status)}>{labelOf(EVENT_STATUSES, event.status)}</Badge>
      </div>
      {event.description ? <p className="mt-3 text-sm leading-6">{event.description}</p> : null}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Venue</dt><dd>{event.venue || "—"}</dd></div>
        <div><dt className="text-muted">Responsible person</dt><dd>{responsible || "—"}</dd></div>
        <div><dt className="text-muted">Expected guests</dt><dd>{event.expectedGuests ?? "—"}</dd></div>
        <div><dt className="text-muted">Planned budget</dt><dd>{formatINR(event.budget)}</dd></div>
        <div><dt className="text-muted">Vendors</dt><dd>{event.vendors || "—"}</dd></div>
        <div><dt className="text-muted">Spending recorded</dt><dd>{formatINR(spend.actual)} actual · {formatINR(spend.estimated)} estimated</dd></div>
      </dl>
      <p className="mt-2 text-xs leading-5 text-muted">
        The planned budget stays on this event. Actual spending comes from {spend.count} linked expense{spend.count === 1 ? "" : "s"} and is not copied into the wedding total twice.
      </p>
      {event.notes ? <p className="mt-3 text-sm text-muted">{event.notes}</p> : null}
      <h3 className="mt-5 font-display text-2xl text-maroon-deep">Checklist · {done}/{event.checklist.length}</h3>
      {event.checklist.length ? (
        <ul className="mt-2">
          {event.checklist.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-maroon" checked={item.done} onChange={() => onToggle(item.id)} />
                <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No checklist items yet.</p>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section>
          <h3 className="font-semibold">Related tasks</h3>
          {tasks.length ? tasks.map((task) => <p key={task.id} className="mt-1 text-sm">{task.title}</p>) : <p className="mt-1 text-sm text-muted">None yet.</p>}
          <Link href={`/tasks?new=1&event=${event.id}`} className="mt-2 inline-block text-sm font-semibold text-maroon">Add a task</Link>
        </section>
        <section>
          <h3 className="font-semibold">Required purchases</h3>
          {purchases.length ? purchases.map((item) => <p key={item.id} className="mt-1 text-sm">{item.name}</p>) : <p className="mt-1 text-sm text-muted">None linked yet.</p>}
          <Link href={`/shopping?new=1&event=${event.id}`} className="mt-2 inline-block text-sm font-semibold text-maroon">Add a purchase</Link>
        </section>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onEdit}>Edit event</Button>
        <Link href={`/budget?new=1&event=${event.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold">Add an expense</Link>
        <Button variant="danger" onClick={onDelete}>Remove event</Button>
      </div>
    </Card>
  );
}

function EventForm({
  initial,
  people,
  onClose,
  onSave,
}: {
  initial?: WeddingEvent;
  people: Person[];
  onClose: () => void;
  onSave: (event: WeddingEvent) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [guests, setGuests] = useState(initial?.expectedGuests == null ? "" : String(initial.expectedGuests));
  const [budget, setBudget] = useState(moneyOrBlank(initial?.budget));
  const [responsiblePersonId, setResponsiblePersonId] = useState(initial?.responsiblePersonId ?? "");
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? "planning");
  const [vendors, setVendors] = useState(initial?.vendors ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? []);
  const [itemLabel, setItemLabel] = useState("");
  const [error, setError] = useState("");

  function applyTemplate(templateName: string) {
    const template = EVENT_TEMPLATES.find((item) => item.name === templateName);
    if (!template) return;
    setName(template.name === "Other ceremony" ? "" : template.name);
    setDescription(template.description);
    setChecklist(template.checklist.map((label) => ({ id: uid(), label, done: false })));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add the event name.");
      return;
    }
    const expectedGuests = parseCount(guests, null);
    const planned = parseMoney(budget);
    if (!expectedGuests.ok || !planned.ok) {
      setError("Guest count and budget must be numbers, or left blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      date,
      startTime,
      endTime,
      venue: venue.trim(),
      description: description.trim(),
      expectedGuests: expectedGuests.value,
      budget: planned.value,
      responsiblePersonId,
      status,
      vendors: vendors.trim(),
      notes: notes.trim(),
      checklist: checklist.filter((item) => item.label.trim()).map((item) => ({ ...item, label: item.label.trim() })),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit event" : "Add an event"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {initial ? null : (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Start from a tradition</span>
            <select className={inputClass} defaultValue="" onChange={(event) => applyTemplate(event.target.value)}>
              <option value="">Blank event</option>
              {EVENT_TEMPLATES.map((template) => <option key={template.name}>{template.name}</option>)}
            </select>
            <span className="mt-1 block text-xs text-muted">These checklists are suggestions. Remove anything your family is not doing.</span>
          </label>
        )}
        <TextField label="Event name" required value={name} onChange={setName} />
        <FormGrid>
          <DateField label="Date" value={date} onChange={setDate} />
          <OptionField label="Status" value={status} onChange={setStatus} options={EVENT_STATUSES} />
          <TimeField label="Start time" value={startTime} onChange={setStartTime} />
          <TimeField label="End time" value={endTime} onChange={setEndTime} />
          <TextField label="Venue" value={venue} onChange={setVenue} />
          <PersonField label="Responsible person" people={people} value={responsiblePersonId} onChange={setResponsiblePersonId} />
          <TextField label="Expected guests" value={guests} onChange={setGuests} hint="Leave blank if you do not know yet." />
          <MoneyField label="Planned budget" value={budget} onChange={setBudget} hint="This is the plan for this event, not a payment." />
        </FormGrid>
        <AreaField label="Description" value={description} onChange={setDescription} />
        <TextField label="Vendors" value={vendors} onChange={setVendors} />
        <div>
          <p className="text-sm font-semibold">Checklist</p>
          <ul className="mt-2 space-y-2">
            {checklist.map((item) => (
              <li key={item.id} className="flex gap-2">
                <input className={inputClass} value={item.label} onChange={(event) => setChecklist(checklist.map((entry) => entry.id === item.id ? { ...entry, label: event.target.value } : entry))} />
                <button type="button" className="min-h-11 px-3 text-sm font-semibold text-danger" onClick={() => setChecklist(checklist.filter((entry) => entry.id !== item.id))}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className={inputClass} value={itemLabel} placeholder="Add a checklist item" onChange={(event) => setItemLabel(event.target.value)} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!itemLabel.trim()) return;
                setChecklist([...checklist, { id: uid(), label: itemLabel.trim(), done: false }]);
                setItemLabel("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
