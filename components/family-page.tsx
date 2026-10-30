"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  AlterationField,
  AreaField,
  DateField,
  EventField,
  FamilyGroupField,
  FilterSelect,
  FormGrid,
  MoneyField,
  OptionField,
  RelationshipField,
  TextField,
} from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, statusTone, useConfirm } from "@/components/ui";
import { FAMILY_GROUPS, PURCHASE_STATUSES, labelOf } from "@/lib/constants";
import { clothingAlerts, eventName } from "@/lib/calc";
import { deadlineLabel, formatINR, moneyOrBlank, parseMoney, todayISO, uid } from "@/lib/format";
import { addClothingToShopping, deleteClothing, deletePerson, saveClothing, savePerson } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { ClothingItem, FamilyGroup, Person, PurchaseStatus } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

export function FamilyPage() {
  const planner = useReadyPlanner();
  const [creatingPerson, setCreatingPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [creatingOutfit, setCreatingOutfit] = useState<string>("");
  const [editingOutfit, setEditingOutfit] = useState<ClothingItem | null>(null);
  const [family, setFamily] = useState("all");
  const [eventId, setEventId] = useState("all");
  const [status, setStatus] = useState("all");
  const [personId, setPersonId] = useState("all");
  const { ask, dialog } = useConfirm();
  const today = todayISO();
  const ready = Boolean(planner);
  useOpenFromQuery("new", useCallback((value: string) => {
    if (value === "1") setCreatingPerson(true);
  }, []), ready);
  useOpenFromQuery("clothing", useCallback((id: string) => {
    const item = planner?.state.clothing.find((entry) => entry.id === id);
    if (item) setEditingOutfit(item);
  }, [planner?.state.clothing]), ready);

  if (!planner) return null;
  const { state, update } = planner;
  const alerts = clothingAlerts(state.clothing, today);
  const people = state.people.filter((person) => (family === "all" ? true : person.familyGroup === family) && (personId === "all" ? true : person.id === personId));
  const clothing = state.clothing.filter((item) => {
    const person = state.people.find((entry) => entry.id === item.personId);
    if (family !== "all" && person?.familyGroup !== family) return false;
    if (personId !== "all" && item.personId !== personId) return false;
    if (eventId !== "all" && item.eventId !== eventId) return false;
    if (status !== "all" && item.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Two families"
        title="Family & clothing"
        subtitle="Add only the outfits each person needs. Nobody is given clothes for every ceremony automatically."
        action={
          <>
            <Button onClick={() => setCreatingPerson(true)}>Add a person</Button>
            <Button variant="secondary" onClick={() => setCreatingOutfit("open")}>Add an outfit</Button>
          </>
        }
      />
      <AlertPanel alerts={alerts} today={today} />
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect label="Family" value={family} onChange={setFamily}>
            <option value="all">Everyone</option>
            {FAMILY_GROUPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Person" value={personId} onChange={setPersonId}>
            <option value="all">All people</option>
            {state.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Event" value={eventId} onChange={setEventId}>
            <option value="all">All events</option>
            {state.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Purchase status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            {PURCHASE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
        </div>
      </Card>
      {people.length ? people.map((person) => {
        const outfits = clothing.filter((item) => item.personId === person.id);
        if (personId === "all" && eventId !== "all" && !outfits.length) return null;
        if (status !== "all" && !outfits.length) return null;
        return (
          <Card key={person.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-3xl text-maroon-deep">{person.name}</h2>
                  <SampleTag show={person.isSample} />
                </div>
                <p className="text-sm text-muted">{person.relationship} · {labelOf(FAMILY_GROUPS, person.familyGroup)}</p>
                {person.phone || person.email ? <p className="mt-1 text-sm">{[person.phone, person.email].filter(Boolean).join(" · ")}</p> : null}
                {person.notes ? <p className="mt-2 text-sm leading-6">{person.notes}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setCreatingOutfit(person.id)}>Add outfit</Button>
                <Button variant="secondary" onClick={() => setEditingPerson(person)}>Edit</Button>
                <Button
                  variant="danger"
                  onClick={() => ask(`Remove ${person.name}?`, "Their clothing records will also be removed. Tasks and gifts stay, but will no longer point at this person.", () => update((current) => deletePerson(current, person.id)))}
                >
                  Remove
                </Button>
              </div>
            </div>
            {outfits.length ? (
              <div className="mt-4 space-y-3">
                {outfits.map((item) => <OutfitRow key={item.id} item={item} eventLabel={eventName(state, item.eventId)} today={today} linked={state.purchases.some((purchase) => purchase.clothingId === item.id)} onEdit={() => setEditingOutfit(item)} onShop={() => update((current) => addClothingToShopping(current, item.id))} onDelete={() => ask(`Delete ${item.clothingType}?`, "This clothing record will be removed. A shopping item linked to it will stay, but the link will be cleared.", () => update((current) => deleteClothing(current, item.id)))} />)}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No outfits for the current filters. Add one only if this person needs clothes for an event.</p>
            )}
          </Card>
        );
      }) : (
        <EmptyState title="No family members yet" body="Add people from the bride's side, Benjamin's side, or other relatives." action={<Button onClick={() => setCreatingPerson(true)}>Add a person</Button>} />
      )}
      {creatingPerson ? <PersonForm onClose={() => setCreatingPerson(false)} onSave={(person) => update((current) => savePerson(current, person))} /> : null}
      {editingPerson ? <PersonForm key={editingPerson.id} initial={editingPerson} onClose={() => setEditingPerson(null)} onSave={(person) => update((current) => savePerson(current, person))} /> : null}
      {creatingOutfit ? (
        <OutfitForm
          people={state.people}
          events={state.events}
          presetPerson={creatingOutfit === "open" ? "" : creatingOutfit}
          onClose={() => setCreatingOutfit("")}
          onSave={(item) => update((current) => saveClothing(current, item))}
        />
      ) : null}
      {editingOutfit ? (
        <OutfitForm
          key={editingOutfit.id}
          initial={editingOutfit}
          people={state.people}
          events={state.events}
          onClose={() => setEditingOutfit(null)}
          onSave={(item) => update((current) => saveClothing(current, item))}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function AlertPanel({
  alerts,
  today,
}: {
  alerts: ReturnType<typeof clothingAlerts>;
  today: string;
}) {
  const lines = [
    ...alerts.fittingOverdue.map((item) => `Fitting overdue · ${formatLabel(item)} · ${deadlineLabel(item.fittingDate, today)}`),
    ...alerts.deliveryOverdue.map((item) => `Delivery overdue · ${formatLabel(item)} · ${deadlineLabel(item.deliveryDeadline, today)}`),
    ...alerts.fittingSoon.map((item) => `Fitting coming up · ${formatLabel(item)} · ${deadlineLabel(item.fittingDate, today)}`),
    ...alerts.deliverySoon.map((item) => `Delivery coming up · ${formatLabel(item)} · ${deadlineLabel(item.deliveryDeadline, today)}`),
    ...alerts.alterations.map((item) => `Alteration ${labelOf([{ value: item.alterationStatus, label: item.alterationStatus }], item.alterationStatus)} · ${formatLabel(item)}`),
  ];
  if (!lines.length && !alerts.toBuy.length) return null;
  return (
    <Card className="border-gold-soft bg-[#fbf6ea]">
      <h2 className="font-display text-3xl text-maroon-deep">Needs attention</h2>
      <p className="mt-1 text-sm text-muted">{alerts.toBuy.length} outfit{alerts.toBuy.length === 1 ? "" : "s"} still to buy or shortlist.</p>
      {lines.length ? <ul className="mt-3 space-y-1 text-sm">{lines.map((line) => <li key={line}>{line}</li>)}</ul> : null}
    </Card>
  );
}

function formatLabel(item: ClothingItem) {
  return item.clothingType;
}

function OutfitRow({
  item,
  eventLabel,
  today,
  linked,
  onEdit,
  onShop,
  onDelete,
}: {
  item: ClothingItem;
  eventLabel: string;
  today: string;
  linked: boolean;
  onEdit: () => void;
  onShop: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{item.clothingType}</h3>
        <SampleTag show={item.isSample} />
        <Badge tone={statusTone(item.status)}>{labelOf(PURCHASE_STATUSES, item.status)}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{eventLabel || "Event not set"}{item.size ? ` · Size ${item.size}` : ""}{item.shop ? ` · ${item.shop}` : ""}</p>
      <p className="mt-1 text-sm">Estimate {formatINR(item.estimatedPrice)} · Actual {formatINR(item.actualPrice)} · Alteration {labelOf([{ value: "not_needed", label: "Not needed" }, { value: "pending", label: "Pending" }, { value: "in_progress", label: "In progress" }, { value: "done", label: "Done" }], item.alterationStatus)}</p>
      <p className="text-sm text-muted">Fitting {deadlineLabel(item.fittingDate, today)} · Delivery {deadlineLabel(item.deliveryDeadline, today)}</p>
      {item.notes ? <p className="mt-1 text-sm text-muted">{item.notes}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEdit}>Edit</Button>
        <Button variant="secondary" onClick={onShop} disabled={linked}>{linked ? "Already on shopping list" : "Add to shopping list"}</Button>
        <Button variant="danger" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}

function PersonForm({ initial, onClose, onSave }: { initial?: Person; onClose: () => void; onSave: (person: Person) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup>(initial?.familyGroup ?? "bride");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !relationship.trim()) {
      setError("Add a name and relationship.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      relationship: relationship.trim(),
      familyGroup,
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit family member" : "Add a family member"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormGrid>
          <TextField label="Name" required value={name} onChange={setName} />
          <RelationshipField value={relationship} onChange={setRelationship} />
          <FamilyGroupField value={familyGroup} onChange={setFamilyGroup} />
          <TextField label="Phone" value={phone} onChange={setPhone} />
          <TextField label="Email" value={email} onChange={setEmail} className="sm:col-span-2" />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

function OutfitForm({
  initial,
  people,
  events,
  presetPerson = "",
  onClose,
  onSave,
}: {
  initial?: ClothingItem;
  people: Person[];
  events: { id: string; name: string; date: string }[];
  presetPerson?: string;
  onClose: () => void;
  onSave: (item: ClothingItem) => void;
}) {
  const [personId, setPersonId] = useState(initial?.personId ?? presetPerson);
  const [eventId, setEventId] = useState(initial?.eventId ?? "");
  const [clothingType, setClothingType] = useState(initial?.clothingType ?? "");
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedPrice));
  const [actual, setActual] = useState(moneyOrBlank(initial?.actualPrice));
  const [shop, setShop] = useState(initial?.shop ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [status, setStatus] = useState<PurchaseStatus>(initial?.status ?? "to_buy");
  const [fittingDate, setFittingDate] = useState(initial?.fittingDate ?? "");
  const [alterationStatus, setAlterationStatus] = useState(initial?.alterationStatus ?? "not_needed");
  const [deliveryDeadline, setDeliveryDeadline] = useState(initial?.deliveryDeadline ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!personId || !clothingType.trim()) {
      setError("Choose the person and the type of clothing.");
      return;
    }
    const estimatedPrice = parseMoney(estimated);
    const actualPrice = parseMoney(actual);
    if (!estimatedPrice.ok || !actualPrice.ok) {
      setError("Prices must be numbers, or left blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      personId,
      eventId,
      clothingType: clothingType.trim(),
      estimatedPrice: estimatedPrice.value,
      actualPrice: actualPrice.value,
      shop: shop.trim(),
      size: size.trim(),
      status,
      fittingDate,
      alterationStatus,
      deliveryDeadline,
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit outfit" : "Add an outfit"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FormGrid>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Person <span className="text-maroon">*</span></span>
            <select className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base" value={personId} onChange={(event) => setPersonId(event.target.value)}>
              <option value="">Select a person</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <EventField label="Event" events={events} value={eventId} onChange={setEventId} />
          <TextField label="Clothing type" required value={clothingType} onChange={setClothingType} hint="For example: lehenga, sherwani, saree." />
          <TextField label="Size, if known" value={size} onChange={setSize} />
          <MoneyField label="Estimated price" value={estimated} onChange={setEstimated} />
          <MoneyField label="Actual price" value={actual} onChange={setActual} />
          <TextField label="Shop" value={shop} onChange={setShop} />
          <OptionField label="Purchase status" value={status} onChange={setStatus} options={PURCHASE_STATUSES} />
          <DateField label="Fitting date" value={fittingDate} onChange={setFittingDate} />
          <AlterationField value={alterationStatus} onChange={setAlterationStatus} />
          <DateField label="Delivery deadline" value={deliveryDeadline} onChange={setDeliveryDeadline} />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
