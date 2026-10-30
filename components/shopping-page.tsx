"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaField,
  CategoryField,
  CheckRow,
  DateField,
  EventField,
  FilterSelect,
  FormGrid,
  MoneyField,
  OptionField,
  PersonField,
  TextField,
  TimeField,
  inputClass,
} from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, statusTone, useConfirm } from "@/components/ui";
import { PRIORITIES, PURCHASE_CATEGORIES, PURCHASE_STATUSES, labelOf } from "@/lib/constants";
import { eventName, groupPurchasesByPlace, isPendingPurchase, lineTotal, matchesDeadline, searchMatch, tripEstimate } from "@/lib/calc";
import { deadlineLabel, formatIN, formatINR, formatTime, moneyOrBlank, parseCount, parseMoney, todayISO, uid } from "@/lib/format";
import { deletePurchase, deleteTrip, savePurchase, saveTrip } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { Person, Priority, Purchase, PurchaseStatus, ShoppingTrip, WeddingEvent } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

export function ShoppingPage() {
  const planner = useReadyPlanner();
  const params = useSearchParams();
  const presetEvent = params.get("event") ?? "";
  const [tab, setTab] = useState<"purchases" | "trips">(params.get("trip") ? "trips" : "purchases");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [tripDraft, setTripDraft] = useState<ShoppingTrip | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [shop, setShop] = useState("all");
  const [deadline, setDeadline] = useState("any");
  const { ask, dialog } = useConfirm();
  const today = todayISO();
  const ready = Boolean(planner);

  const openPurchase = useCallback((id: string) => {
    const purchase = planner?.state.purchases.find((item) => item.id === id);
    if (purchase) {
      setTab("purchases");
      setEditing(purchase);
    }
  }, [planner?.state.purchases]);
  const openTrip = useCallback((id: string) => {
    const trip = planner?.state.trips.find((item) => item.id === id);
    if (trip) {
      setTab("trips");
      setTripDraft(trip);
    }
  }, [planner?.state.trips]);
  useOpenFromQuery("edit", openPurchase, ready);
  useOpenFromQuery("trip", openTrip, ready);
  useOpenFromQuery("new", useCallback((value: string) => {
    if (value === "1") {
      setTab("purchases");
      setCreating(true);
    }
  }, []), ready);

  const shops = useMemo(() => {
    const names = new Set((planner?.state.purchases ?? []).map((item) => item.shop.trim()).filter(Boolean));
    return [...names].sort();
  }, [planner?.state.purchases]);

  if (!planner) return null;
  const { state, update } = planner;
  const groups = groupPurchasesByPlace(state.purchases);
  const purchases = state.purchases
    .filter((item) => (category === "all" ? true : item.category === category))
    .filter((item) => (status === "all" ? true : item.status === status))
    .filter((item) => (priority === "all" ? true : item.priority === priority))
    .filter((item) => (shop === "all" ? true : item.shop === shop))
    .filter((item) => matchesDeadline(item.deadline, deadline, today))
    .filter((item) => searchMatch(query, [item.name, item.shop, item.market, item.notes, item.recipientName, item.category]));

  function startTrip(purchaseIds: string[], place = "") {
    setTripDraft({
      id: uid(),
      name: place && place !== "Shop not set" ? `${place} trip` : "Shopping trip",
      date: "",
      departureTime: "",
      destination: place && place !== "Shop not set" ? place : state.settings.marketName,
      travelMinutes: state.settings.travelMinutes,
      memberIds: [],
      shops: place && place !== "Shop not set" ? place : "",
      purchaseIds,
      notes: "",
      isSample: false,
    });
    setTab("trips");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="About 30 minutes from home"
        title="Shopping"
        subtitle="Group items from the same shop into one trip. This list shows what can be combined. It does not plan the driving route."
        action={
          <>
            <Button onClick={() => setCreating(true)}>Add a purchase</Button>
            <Button variant="secondary" onClick={() => startTrip([])}>
              Plan a trip
            </Button>
          </>
        }
      />

      <Card>
        <h2 className="font-display text-3xl text-maroon-deep">Same shop or market</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Pending items are grouped by the shop name you entered. Put a group on one trip instead of going out more than once.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {groups.map(([place, items]) => (
            <div key={place} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{place}</h3>
                  <p className="text-sm text-muted">{items.length} item{items.length === 1 ? "" : "s"} still to buy</p>
                </div>
                <Button variant="secondary" onClick={() => startTrip(items.map((item) => item.id), place)}>Add to a trip</Button>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {items.slice(0, 4).map((item) => <li key={item.id}>{item.name}</li>)}
                {items.length > 4 ? <li className="text-muted">+{items.length - 4} more</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <button type="button" className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${tab === "purchases" ? "bg-maroon text-ivory" : "border border-line bg-white"}`} onClick={() => setTab("purchases")}>Purchases</button>
        <button type="button" className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${tab === "trips" ? "bg-maroon text-ivory" : "border border-line bg-white"}`} onClick={() => setTab("trips")}>Shopping trips</button>
      </div>

      {tab === "purchases" ? (
        <>
          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="md:col-span-2 xl:col-span-3">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Search</span>
                <input className={inputClass} value={query} placeholder="Search purchases" onChange={(event) => setQuery(event.target.value)} />
              </label>
              <FilterSelect label="Category" value={category} onChange={setCategory}>
                <option value="all">All</option>
                {PURCHASE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </FilterSelect>
              <FilterSelect label="Status" value={status} onChange={setStatus}>
                <option value="all">All</option>
                {PURCHASE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </FilterSelect>
              <FilterSelect label="Priority" value={priority} onChange={setPriority}>
                <option value="all">All</option>
                {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </FilterSelect>
              <FilterSelect label="Shop" value={shop} onChange={setShop}>
                <option value="all">All shops</option>
                {shops.map((item) => <option key={item}>{item}</option>)}
              </FilterSelect>
              <FilterSelect label="Deadline" value={deadline} onChange={setDeadline}>
                <option value="any">Any date</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="week">Next 7 days</option>
                <option value="later">Later</option>
                <option value="none">No date</option>
              </FilterSelect>
            </div>
          </Card>
          {purchases.length ? (
            <div className="space-y-3">
              {purchases.map((item) => {
                const trip = state.trips.find((entry) => entry.id === item.tripId);
                const total = lineTotal(item.estimatedPrice, item.quantity);
                return (
                  <Card key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{item.name}</h2>
                          <SampleTag show={item.isSample} />
                          {item.clothingId ? <Badge tone="maroon">Linked outfit</Badge> : null}
                          {item.giftId ? <Badge tone="maroon">Linked gift</Badge> : null}
                        </div>
                        <p className="text-sm text-muted">{item.category} · Qty {item.quantity}</p>
                      </div>
                      <Badge tone={statusTone(item.status)}>{labelOf(PURCHASE_STATUSES, item.status)}</Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-muted">For</dt><dd>{item.recipientName || "—"}</dd></div>
                      <div><dt className="text-muted">Event</dt><dd>{eventName(state, item.eventId) || "—"}</dd></div>
                      <div><dt className="text-muted">Shop</dt><dd>{item.shop || "Shop not set"}</dd></div>
                      <div><dt className="text-muted">Estimated total</dt><dd>{formatINR(total)}</dd></div>
                      <div><dt className="text-muted">Actual price each</dt><dd>{formatINR(item.actualPrice)}</dd></div>
                      <div><dt className="text-muted">Deadline</dt><dd className={item.deadline && item.deadline < today && isPendingPurchase(item.status) ? "font-semibold text-danger" : ""}>{deadlineLabel(item.deadline, today)}</dd></div>
                    </dl>
                    {trip ? <p className="mt-2 text-sm">On trip: {trip.name}{trip.date ? ` · ${formatIN(trip.date)}` : " · date not set"}</p> : null}
                    {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {isPendingPurchase(item.status) ? (
                        <Button variant="secondary" onClick={() => update((current) => savePurchase(current, { ...item, status: "purchased" }))}>Mark purchased</Button>
                      ) : null}
                      <Button variant="secondary" onClick={() => setEditing(item)}>Edit</Button>
                      <Button variant="danger" onClick={() => ask(`Delete “${item.name}”?`, "The purchase will be removed from any shopping trip. A linked outfit or gift will stay.", () => update((current) => deletePurchase(current, item.id)))}>Delete</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No purchases match" body="Add something you still need to buy, or clear a filter." action={<Button onClick={() => setCreating(true)}>Add a purchase</Button>} />
          )}
        </>
      ) : (
        <div className="space-y-3">
          {state.trips.length ? state.trips.map((trip) => {
            const estimate = tripEstimate(trip, state.purchases);
            const members = trip.memberIds.map((id) => state.people.find((person) => person.id === id)?.name).filter(Boolean);
            return (
              <Card key={trip.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-3xl text-maroon-deep">{trip.name}</h2>
                      <SampleTag show={trip.isSample} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {trip.date ? formatIN(trip.date) : "Date not set"}
                      {trip.departureTime ? ` · leave ${formatTime(trip.departureTime)}` : ""}
                      {trip.destination ? ` · ${trip.destination}` : ""}
                    </p>
                  </div>
                  <p className="font-display text-3xl text-maroon">{formatINR(estimate.total)}</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {estimate.items.length} items
                  {estimate.missingPrices ? ` · ${estimate.missingPrices} without a price` : ""}
                  {trip.travelMinutes != null ? ` · ${trip.travelMinutes} min travel` : ""}
                  {members.length ? ` · ${members.join(", ")}` : ""}
                </p>
                {trip.shops ? <p className="mt-1 text-sm">Shops: {trip.shops}</p> : null}
                <ul className="mt-3 divide-y divide-line">
                  {estimate.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span>{item.name} · qty {item.quantity} · {formatINR(lineTotal(item.estimatedPrice, item.quantity))}</span>
                      <select
                        className="rounded-lg border border-line bg-white px-2 py-2"
                        value={item.status}
                        aria-label={`Status for ${item.name}`}
                        onChange={(event) => update((current) => savePurchase(current, { ...item, status: event.target.value as PurchaseStatus }))}
                      >
                        {PURCHASE_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
                {trip.notes ? <p className="mt-2 text-sm text-muted">{trip.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setTripDraft(trip)}>Edit trip</Button>
                  <Button variant="danger" onClick={() => ask(`Delete “${trip.name}”?`, "The trip will be removed. The purchases stay on the shopping list.", () => update((current) => deleteTrip(current, trip.id)))}>Delete trip</Button>
                </div>
              </Card>
            );
          }) : (
            <EmptyState title="No shopping trips yet" body="Select items from the same market and give the trip a date." action={<Button onClick={() => startTrip([])}>Plan a trip</Button>} />
          )}
        </div>
      )}

      {creating ? (
        <PurchaseForm
          people={state.people}
          events={state.events}
          trips={state.trips}
          presetEvent={presetEvent}
          onClose={() => setCreating(false)}
          onSave={(purchase) => update((current) => savePurchase(current, purchase))}
        />
      ) : null}
      {editing ? (
        <PurchaseForm
          key={editing.id}
          initial={editing}
          people={state.people}
          events={state.events}
          trips={state.trips}
          onClose={() => setEditing(null)}
          onSave={(purchase) => update((current) => savePurchase(current, purchase))}
        />
      ) : null}
      {tripDraft ? (
        <TripForm
          key={tripDraft.id}
          initial={tripDraft}
          people={state.people}
          purchases={state.purchases}
          onClose={() => setTripDraft(null)}
          onSave={(trip) => update((current) => saveTrip(current, trip))}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function PurchaseForm({
  initial,
  people,
  events,
  trips,
  presetEvent = "",
  onClose,
  onSave,
}: {
  initial?: Purchase;
  people: Person[];
  events: WeddingEvent[];
  trips: ShoppingTrip[];
  presetEvent?: string;
  onClose: () => void;
  onSave: (purchase: Purchase) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [recipientId, setRecipientId] = useState(initial?.recipientId ?? "");
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [eventId, setEventId] = useState(initial?.eventId ?? presetEvent);
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedPrice));
  const [actual, setActual] = useState(moneyOrBlank(initial?.actualPrice));
  const [shop, setShop] = useState(initial?.shop ?? "");
  const [market, setMarket] = useState(initial?.market ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [status, setStatus] = useState<PurchaseStatus>(initial?.status ?? "to_buy");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tripId, setTripId] = useState(initial?.tripId ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !category) {
      setError("Add the item name and category.");
      return;
    }
    const qty = parseCount(quantity, 1);
    const estimatedPrice = parseMoney(estimated);
    const actualPrice = parseMoney(actual);
    if (!qty.ok || qty.value == null || qty.value < 1 || !estimatedPrice.ok || !actualPrice.ok) {
      setError("Quantity must be at least 1. Prices must be numbers or blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      category,
      quantity: qty.value,
      recipientId,
      recipientName: recipientName.trim(),
      eventId,
      estimatedPrice: estimatedPrice.value,
      actualPrice: actualPrice.value,
      shop: shop.trim(),
      market: market.trim(),
      priority,
      deadline,
      status,
      notes: notes.trim(),
      tripId,
      clothingId: initial?.clothingId ?? "",
      giftId: initial?.giftId ?? "",
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit purchase" : "Add a purchase"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Item name" required value={name} onChange={setName} />
        <FormGrid>
          <CategoryField label="Category" value={category} onChange={setCategory} options={PURCHASE_CATEGORIES} />
          <TextField label="Quantity" value={quantity} onChange={setQuantity} />
          <PersonField
            label="Recipient in the family list"
            people={people}
            value={recipientId}
            onChange={(id) => {
              setRecipientId(id);
              const person = people.find((item) => item.id === id);
              if (person) setRecipientName(person.name);
            }}
          />
          <TextField label="Recipient name" value={recipientName} onChange={setRecipientName} hint="For a guest or anyone not in the family list." />
          <EventField label="Related event" events={events} value={eventId} onChange={setEventId} />
          <OptionField label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          <MoneyField label="Estimated price (per item)" value={estimated} onChange={setEstimated} />
          <MoneyField label="Actual price (per item)" value={actual} onChange={setActual} />
          <TextField label="Shop name" value={shop} onChange={setShop} hint="Items with the same shop can share a trip." />
          <TextField label="Market or area" value={market} onChange={setMarket} />
          <DateField label="Deadline" value={deadline} onChange={setDeadline} />
          <OptionField label="Purchase status" value={status} onChange={setStatus} options={PURCHASE_STATUSES} />
        </FormGrid>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Shopping trip</span>
          <select className={inputClass} value={tripId} onChange={(event) => setTripId(event.target.value)}>
            <option value="">Not on a trip yet</option>
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}
          </select>
        </label>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}

function TripForm({
  initial,
  people,
  purchases,
  onClose,
  onSave,
}: {
  initial: ShoppingTrip;
  people: Person[];
  purchases: Purchase[];
  onClose: () => void;
  onSave: (trip: ShoppingTrip) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [departureTime, setDepartureTime] = useState(initial.departureTime);
  const [destination, setDestination] = useState(initial.destination);
  const [travel, setTravel] = useState(initial.travelMinutes == null ? "" : String(initial.travelMinutes));
  const [memberIds, setMemberIds] = useState(initial.memberIds);
  const [shops, setShops] = useState(initial.shops);
  const [purchaseIds, setPurchaseIds] = useState(initial.purchaseIds);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState("");
  const selectable = purchases.filter((item) => item.status !== "cancelled" && (isPendingPurchase(item.status) || purchaseIds.includes(item.id)));
  const estimate = tripEstimate({ ...initial, purchaseIds }, purchases);

  function toggle(list: string[], id: string, checked: boolean) {
    return checked ? [...list, id] : list.filter((item) => item !== id);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name the trip.");
      return;
    }
    const travelMinutes = parseCount(travel, null);
    if (!travelMinutes.ok) {
      setError("Travel time must be a whole number of minutes, or blank.");
      return;
    }
    onSave({
      ...initial,
      name: name.trim(),
      date,
      departureTime,
      destination: destination.trim(),
      travelMinutes: travelMinutes.value,
      memberIds,
      shops: shops.trim(),
      purchaseIds,
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title="Shopping trip" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-muted">Estimated total is the sum of selected item prices. The app does not choose a driving route.</p>
        <FormGrid>
          <TextField label="Trip name" required value={name} onChange={setName} />
          <DateField label="Date" value={date} onChange={setDate} />
          <TimeField label="Departure time" value={departureTime} onChange={setDepartureTime} />
          <TextField label="Destination or market" value={destination} onChange={setDestination} />
          <TextField label="Travel time (minutes)" value={travel} onChange={setTravel} hint="About 30 minutes unless you change it." />
          <TextField label="Shops to visit" value={shops} onChange={setShops} />
        </FormGrid>
        <div>
          <p className="text-sm font-semibold">Family members going</p>
          {people.map((person) => (
            <CheckRow key={person.id} checked={memberIds.includes(person.id)} label={person.name} onChange={(checked) => setMemberIds(toggle(memberIds, person.id, checked))} />
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Purchases on this trip</p>
            <p className="font-display text-2xl text-maroon">{formatINR(estimate.total)}</p>
          </div>
          {selectable.map((item) => (
            <CheckRow
              key={item.id}
              checked={purchaseIds.includes(item.id)}
              label={`${item.name} · ${item.shop || "Shop not set"} · ${formatINR(lineTotal(item.estimatedPrice, item.quantity))}`}
              onChange={(checked) => setPurchaseIds(toggle(purchaseIds, item.id, checked))}
            />
          ))}
        </div>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} saveLabel="Save trip" />
      </form>
    </Modal>
  );
}
