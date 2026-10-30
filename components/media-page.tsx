"use client";

import { useState, type FormEvent } from "react";
import { AreaField, DateField, EventField, FormGrid, MoneyField, OptionField, PersonField, TextField, inputClass } from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, statusTone, useConfirm } from "@/components/ui";
import { MEDIA_KINDS, MEDIA_STATUSES, labelOf } from "@/lib/constants";
import { eventName, personName } from "@/lib/calc";
import { deadlineLabel, formatINR, moneyOrBlank, parseMoney, todayISO, uid } from "@/lib/format";
import { deleteMedia, saveMedia } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { MediaItem, MediaStatus, Person, WeddingEvent } from "@/lib/types";

export function MediaPage() {
  const planner = useReadyPlanner();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const { ask, dialog } = useConfirm();
  const today = todayISO();
  if (!planner) return null;
  const { state, update } = planner;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Creative work"
        title="Cards, photos & videos"
        subtitle="Track invitations, the photoshoot, and film delivery. Paste a link if the file lives somewhere else. This page does not upload the video itself."
        action={<Button onClick={() => setCreating(true)}>Add an item</Button>}
      />
      {state.media.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {state.media.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <SampleTag show={item.isSample} />
                  </div>
                  <p className="text-sm text-muted">{item.kind}</p>
                </div>
                <Badge tone={statusTone(item.status)}>{labelOf(MEDIA_STATUSES, item.status)}</Badge>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div><dt className="inline text-muted">Event · </dt><dd className="inline">{eventName(state, item.eventId) || "—"}</dd></div>
                <div><dt className="inline text-muted">Responsible · </dt><dd className="inline">{personName(state, item.responsiblePersonId) || "—"}</dd></div>
                <div><dt className="inline text-muted">Vendor · </dt><dd className="inline">{item.vendor || "—"}</dd></div>
                <div><dt className="inline text-muted">Deadline · </dt><dd className={`inline ${item.deadline && item.deadline < today && item.status !== "delivered" ? "font-semibold text-danger" : ""}`}>{deadlineLabel(item.deadline, today)}</dd></div>
                <div><dt className="inline text-muted">Estimate · </dt><dd className="inline">{formatINR(item.estimatedCost)}</dd></div>
              </dl>
              {item.notes ? <p className="mt-2 text-sm leading-6 text-muted">{item.notes}</p> : null}
              {item.link ? (
                <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-maroon underline">
                  Open reference link
                </a>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                <Button variant="danger" onClick={() => ask(`Delete “${item.name}”?`, "This creative item will be removed.", () => update((current) => deleteMedia(current, item.id)))}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing tracked yet" body="Add the invitation card, photoshoot, or highlight video when you start planning it." action={<Button onClick={() => setCreating(true)}>Add an item</Button>} />
      )}
      {creating ? <MediaForm people={state.people} events={state.events} onClose={() => setCreating(false)} onSave={(item) => update((current) => saveMedia(current, item))} /> : null}
      {editing ? <MediaForm key={editing.id} initial={editing} people={state.people} events={state.events} onClose={() => setEditing(null)} onSave={(item) => update((current) => saveMedia(current, item))} /> : null}
      {dialog}
    </div>
  );
}

function MediaForm({
  initial,
  people,
  events,
  onClose,
  onSave,
}: {
  initial?: MediaItem;
  people: Person[];
  events: WeddingEvent[];
  onClose: () => void;
  onSave: (item: MediaItem) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "");
  const [eventId, setEventId] = useState(initial?.eventId ?? "");
  const [responsiblePersonId, setResponsiblePersonId] = useState(initial?.responsiblePersonId ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedCost));
  const [status, setStatus] = useState<MediaStatus>(initial?.status ?? "planning");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !kind) {
      setError("Add a name and the kind of work.");
      return;
    }
    if (link.trim() && !/^https?:\/\//i.test(link.trim())) {
      setError("A reference link should start with http:// or https://.");
      return;
    }
    const estimatedCost = parseMoney(estimated);
    if (!estimatedCost.ok) {
      setError("Estimated cost must be a number, or blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      kind,
      eventId,
      responsiblePersonId,
      vendor: vendor.trim(),
      deadline,
      estimatedCost: estimatedCost.value,
      status,
      notes: notes.trim(),
      link: link.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit item" : "Add an item"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FormGrid>
          <TextField label="Item name" required value={name} onChange={setName} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Kind <span className="text-maroon">*</span></span>
            <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="">Select</option>
              {MEDIA_KINDS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <EventField label="Related event" events={events} value={eventId} onChange={setEventId} />
          <PersonField label="Responsible person" people={people} value={responsiblePersonId} onChange={setResponsiblePersonId} />
          <TextField label="Vendor or designer" value={vendor} onChange={setVendor} />
          <OptionField label="Status" value={status} onChange={setStatus} options={MEDIA_STATUSES} />
          <DateField label="Deadline" value={deadline} onChange={setDeadline} />
          <MoneyField label="Estimated cost" value={estimated} onChange={setEstimated} />
          <TextField label="Reference link" value={link} onChange={setLink} className="sm:col-span-2" hint="Optional. Paste a Drive, WhatsApp, or designer link." />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
