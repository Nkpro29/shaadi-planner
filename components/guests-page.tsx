"use client";

import { useState, type FormEvent } from "react";
import { AreaField, FilterSelect, FormGrid, OptionField, TextField, inputClass } from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, Stat, statusTone, useConfirm } from "@/components/ui";
import { GUEST_GROUPS, INVITE_STATUSES, RSVP_STATUSES, STEP_STATUSES, labelOf } from "@/lib/constants";
import { guestStats } from "@/lib/calc";
import { csvToGuests, guestsToCsv } from "@/lib/csv";
import { downloadText, parseCount, uid } from "@/lib/format";
import { deleteGuest, importGuests, saveGuest, saveInvitation } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { Guest, InvitationPlan, InviteStatus, RsvpStatus, StepStatus, WeddingEvent } from "@/lib/types";

export function GuestsPage() {
  const planner = useReadyPlanner();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [rsvp, setRsvp] = useState("all");
  const [invite, setInvite] = useState("all");
  const [message, setMessage] = useState("");
  const { ask, dialog } = useConfirm();
  if (!planner) return null;
  const { state, update } = planner;
  const stats = guestStats(state);
  const guests = state.guests.filter((guest) => {
    if (group !== "all" && guest.relationshipGroup !== group) return false;
    if (rsvp !== "all" && guest.rsvpStatus !== rsvp) return false;
    if (invite !== "all" && guest.invitationStatus !== invite) return false;
    const haystack = `${guest.name} ${guest.household} ${guest.city} ${guest.notes}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Invitations"
        title="Guests"
        subtitle="Keep the guest list and card progress here. ShaadiSaathi does not send invitations."
        action={
          <>
            <Button onClick={() => setCreating(true)}>Add a guest</Button>
            <Button variant="secondary" onClick={() => downloadText("shaadisaathi-guests.csv", guestsToCsv(state.guests, state.events), "text/csv")}>Export CSV</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="People listed" value={String(stats.people)} hint={`${stats.households} households`} />
        <Stat label="Invitations pending" value={String(stats.invitePendingHouseholds)} hint={`${stats.invitePendingPeople} people not sent a card yet`} />
        <Stat label="Confirmed attendees" value={String(stats.confirmedPeople)} />
        <Stat label="Cannot attend" value={String(stats.declinedPeople)} hint={`${stats.staying} households noted a stay`} />
      </div>
      <Card>
        <h2 className="font-display text-3xl text-maroon-deep">Invitation cards</h2>
        <p className="mt-1 text-sm text-muted">Track design, wording, printing, and the invitation video. Detailed creative work also lives under Cards, Photos & Videos.</p>
        <InvitationForm plan={state.invitation} onSave={(plan) => update((current) => saveInvitation(current, plan))} />
      </Card>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="md:col-span-4">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Search</span>
            <input className={inputClass} value={query} placeholder="Search guests" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <FilterSelect label="Group" value={group} onChange={setGroup}>
            <option value="all">All groups</option>
            {GUEST_GROUPS.map((item) => <option key={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Invitation" value={invite} onChange={setInvite}>
            <option value="all">All</option>
            {INVITE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="RSVP" value={rsvp} onChange={setRsvp}>
            <option value="all">All</option>
            {RSVP_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Import CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const imported = csvToGuests(String(reader.result), state.events);
                    if (!imported.length) {
                      setMessage("No guest names were found in that file.");
                      return;
                    }
                    update((current) => importGuests(current, imported));
                    setMessage(`${imported.length} guest${imported.length === 1 ? "" : "s"} added. Nothing was sent.`);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Could not read that CSV.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </Card>
      {guests.length ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Group</th>
                <th className="px-4 py-3 font-semibold">People</th>
                <th className="px-4 py-3 font-semibold">Invitation</th>
                <th className="px-4 py-3 font-semibold">RSVP</th>
                <th className="px-4 py-3 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      {guest.name}
                      <SampleTag show={guest.isSample} />
                    </div>
                    <div className="text-muted">{guest.household}{guest.city ? ` · ${guest.city}` : ""}</div>
                    {guest.accommodation ? <div className="text-muted">Stay: {guest.accommodation}</div> : null}
                  </td>
                  <td className="px-4 py-3">{guest.relationshipGroup}</td>
                  <td className="px-4 py-3">{guest.memberCount}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(guest.invitationStatus)}>{labelOf(INVITE_STATUSES, guest.invitationStatus)}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone(guest.rsvpStatus)}>{labelOf(RSVP_STATUSES, guest.rsvpStatus)}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setEditing(guest)}>Edit</Button>
                      <Button variant="danger" onClick={() => ask(`Remove ${guest.name}?`, "This guest record will be deleted.", () => update((current) => deleteGuest(current, guest.id)))}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No guests match" body="Add a household, or import a CSV with a Name column." action={<Button onClick={() => setCreating(true)}>Add a guest</Button>} />
      )}
      {creating ? <GuestForm events={state.events} onClose={() => setCreating(false)} onSave={(guest) => update((current) => saveGuest(current, guest))} /> : null}
      {editing ? <GuestForm key={editing.id} initial={editing} events={state.events} onClose={() => setEditing(null)} onSave={(guest) => update((current) => saveGuest(current, guest))} /> : null}
      {dialog}
    </div>
  );
}


function InvitationForm({ plan, onSave }: { plan: InvitationPlan; onSave: (plan: InvitationPlan) => void }) {
  const [cardDesign, setCardDesign] = useState<StepStatus>(plan.cardDesign);
  const [textFinalization, setTextFinalization] = useState<StepStatus>(plan.textFinalization);
  const [printing, setPrinting] = useState<StepStatus>(plan.printing);
  const [quantity, setQuantity] = useState(plan.quantity == null ? "" : String(plan.quantity));
  const [distribution, setDistribution] = useState<StepStatus>(plan.distribution);
  const [digitalInvitation, setDigitalInvitation] = useState<StepStatus>(plan.digitalInvitation);
  const [invitationVideo, setInvitationVideo] = useState<StepStatus>(plan.invitationVideo);
  const [notes, setNotes] = useState(plan.notes);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const count = parseCount(quantity, null);
    if (!count.ok) {
      setError("Card quantity must be a whole number, or blank.");
      return;
    }
    setError("");
    onSave({ cardDesign, textFinalization, printing, quantity: count.value, distribution, digitalInvitation, invitationVideo, notes: notes.trim() });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <FormGrid>
        <OptionField label="Card design" value={cardDesign} onChange={setCardDesign} options={STEP_STATUSES} />
        <OptionField label="Text finalization" value={textFinalization} onChange={setTextFinalization} options={STEP_STATUSES} />
        <OptionField label="Printing" value={printing} onChange={setPrinting} options={STEP_STATUSES} />
        <TextField label="Quantity" value={quantity} onChange={setQuantity} />
        <OptionField label="Distribution" value={distribution} onChange={setDistribution} options={STEP_STATUSES} />
        <OptionField label="Digital invitation" value={digitalInvitation} onChange={setDigitalInvitation} options={STEP_STATUSES} />
        <OptionField label="Invitation video" value={invitationVideo} onChange={setInvitationVideo} options={STEP_STATUSES} />
      </FormGrid>
      <AreaField label="Notes" value={notes} onChange={setNotes} />
      <FormError message={error} />
      <Button type="submit">Save invitation progress</Button>
    </form>
  );
}

function GuestForm({
  initial,
  events,
  onClose,
  onSave,
}: {
  initial?: Guest;
  events: WeddingEvent[];
  onClose: () => void;
  onSave: (guest: Guest) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [household, setHousehold] = useState(initial?.household ?? "");
  const [relationshipGroup, setRelationshipGroup] = useState(initial?.relationshipGroup ?? "Bride's family");
  const [city, setCity] = useState(initial?.city ?? "");
  const [memberCount, setMemberCount] = useState(String(initial?.memberCount ?? 1));
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [invitationStatus, setInvitationStatus] = useState<InviteStatus>(initial?.invitationStatus ?? "not_sent");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(initial?.rsvpStatus ?? "awaiting");
  const [eventIds, setEventIds] = useState<string[]>(initial?.eventIds ?? []);
  const [accommodation, setAccommodation] = useState(initial?.accommodation ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const groups = GUEST_GROUPS.includes(relationshipGroup as (typeof GUEST_GROUPS)[number]) ? GUEST_GROUPS : [relationshipGroup, ...GUEST_GROUPS];

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add the guest or household name.");
      return;
    }
    const count = parseCount(memberCount, 1);
    if (!count.ok || count.value == null || count.value < 1) {
      setError("Family members must be at least 1.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      household: household.trim() || name.trim(),
      relationshipGroup,
      city: city.trim(),
      memberCount: count.value,
      phone: phone.trim(),
      invitationStatus,
      rsvpStatus,
      eventIds,
      accommodation: accommodation.trim(),
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit guest" : "Add a guest"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FormGrid>
          <TextField label="Name" required value={name} onChange={setName} />
          <TextField label="Family or household" value={household} onChange={setHousehold} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Relationship group</span>
            <select className={inputClass} value={relationshipGroup} onChange={(event) => setRelationshipGroup(event.target.value)}>
              {groups.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <TextField label="City or country" value={city} onChange={setCity} />
          <TextField label="Number of family members" value={memberCount} onChange={setMemberCount} />
          <TextField label="Phone" value={phone} onChange={setPhone} />
          <OptionField label="Invitation status" value={invitationStatus} onChange={setInvitationStatus} options={INVITE_STATUSES} />
          <OptionField label="RSVP status" value={rsvpStatus} onChange={setRsvpStatus} options={RSVP_STATUSES} />
        </FormGrid>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Events invited to</legend>
          {events.map((event) => (
            <label key={event.id} className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-maroon"
                checked={eventIds.includes(event.id)}
                onChange={(change) => setEventIds(change.target.checked ? [...eventIds, event.id] : eventIds.filter((id) => id !== event.id))}
              />
              {event.name}
            </label>
          ))}
        </fieldset>
        <TextField label="Accommodation" value={accommodation} onChange={setAccommodation} hint="Leave blank if they do not need a place to stay." />
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
