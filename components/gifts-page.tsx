"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AreaField, CheckRow, FormGrid, MoneyField, OptionField, PersonField, TextField, inputClass } from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, Stat, statusTone, useConfirm } from "@/components/ui";
import { GIFT_OCCASIONS, GIFT_STATUSES, PACKAGING_STATUSES, labelOf } from "@/lib/constants";
import { bhaatSummary, lineTotal, returnGiftMath } from "@/lib/calc";
import { formatINR, moneyOrBlank, parseCount, parseMoney, uid } from "@/lib/format";
import { addGiftToShopping, deleteGift, saveGift, saveReturnGifts } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { Gift, GiftStatus, PackagingStatus, Person } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

type GiftView = "all" | "bhaat" | "returns";

export function GiftsPage() {
  const planner = useReadyPlanner();
  const params = useSearchParams();
  const view: GiftView = params.get("view") === "bhaat" ? "bhaat" : params.get("view") === "returns" ? "returns" : "all";
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const { ask, dialog } = useConfirm();
  const ready = Boolean(planner);
  useOpenFromQuery("new", useCallback((value: string) => {
    if (value === "1") setCreating(true);
  }, []), ready);

  if (!planner) return null;
  const { state, update } = planner;
  const summary = bhaatSummary(state.gifts);
  const returns = returnGiftMath(state.returnGifts);
  const visible = state.gifts.filter((gift) => {
    if (view === "bhaat") return gift.occasion === "Bhaat";
    if (view === "returns") return gift.occasion === "Guest return gifts";
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Gifts"
        title={view === "bhaat" ? "Bhaat" : view === "returns" ? "Guest return gifts" : "Gifts & Bhaat"}
        subtitle="Track Mama gifts, family gifts, and return gifts separately. Change recipients and quantities to match your own tradition."
        action={<Button onClick={() => setCreating(true)}>Add a gift</Button>}
      />
      <div className="flex flex-wrap gap-2">
        <Tab href="/gifts" active={view === "all"}>All gifts</Tab>
        <Tab href="/gifts?view=bhaat" active={view === "bhaat"}>Bhaat</Tab>
        <Tab href="/gifts?view=returns" active={view === "returns"}>Return gifts</Tab>
      </div>

      {view === "bhaat" ? (
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Bhaat summary</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Recipients" value={String(summary.recipients.length)} />
            <Stat label="Gifts required" value={String(summary.required)} />
            <Stat label="Purchased" value={String(summary.purchased)} />
            <Stat label="Pending" value={String(summary.pending)} />
            <Stat label="Estimated" value={formatINR(summary.estimated)} />
            <Stat label="Actual" value={formatINR(summary.actual)} hint={summary.actual == null ? "No actual costs entered" : undefined} />
          </div>
          <div className="mt-4 space-y-3">
            {summary.recipients.length ? summary.recipients.map((row) => (
              <div key={row.name} className="rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{row.name}</h3>
                  {row.forFamily ? <Badge tone="maroon">For the family</Badge> : null}
                  <span className="text-sm text-muted">{row.relationship}</span>
                </div>
                <p className="mt-1 text-sm">Required {row.required} · Purchased {row.purchased} · Pending {row.pending}</p>
                <p className="text-sm text-muted">Estimated {formatINR(row.estimated)} · Actual {formatINR(row.actual)}</p>
                <ul className="mt-2 text-sm">
                  {row.gifts.map((gift) => <li key={gift.id}>{gift.description} · qty {gift.quantity} · {labelOf(GIFT_STATUSES, gift.status)}</li>)}
                </ul>
              </div>
            )) : <p className="text-sm text-muted">No Bhaat recipients yet. Add a gift and choose the Bhaat occasion.</p>}
          </div>
        </Card>
      ) : null}

      {view === "returns" ? (
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Return gift quantities</h2>
          <ReturnForm
            plan={state.returnGifts}
            onSave={(plan) => update((current) => saveReturnGifts(current, plan))}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Expected" value={returns.expected == null ? "—" : String(returns.expected)} />
            <Stat label="Purchased" value={returns.purchased == null ? "—" : String(returns.purchased)} />
            <Stat label="Distributed" value={returns.distributed == null ? "—" : String(returns.distributed)} />
            <Stat label="Remaining" value={returns.remaining == null ? "—" : String(returns.remaining)} />
            <Stat label="Total cost" value={formatINR(returns.totalCost)} hint="Purchased quantity × cost per item" />
          </div>
          {returns.shortfall ? (
            <p className="mt-4 rounded-xl bg-[#f8ebe9] px-3 py-2 text-sm text-danger">
              Purchased quantity is lower than the expected quantity. Buy more, or lower the expected number.
            </p>
          ) : null}
          {returns.overDistributed ? (
            <p className="mt-4 rounded-xl bg-[#f8ebe9] px-3 py-2 text-sm text-danger">
              Distributed quantity is higher than the purchased quantity. Check the numbers.
            </p>
          ) : null}
        </Card>
      ) : null}

      {visible.length ? (
        <div className="space-y-3">
          {visible.map((gift) => {
            const linked = state.purchases.some((item) => item.giftId === gift.id);
            return (
              <Card key={gift.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{gift.description || "Gift"}</h2>
                      <SampleTag show={gift.isSample} />
                      {gift.forFamily ? <Badge tone="maroon">For the family</Badge> : null}
                    </div>
                    <p className="text-sm text-muted">{gift.recipientName} · {gift.relationship || "Relationship not set"} · {gift.occasion}</p>
                  </div>
                  <Badge tone={statusTone(gift.status)}>{labelOf(GIFT_STATUSES, gift.status)}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Quantity</dt><dd>{gift.quantity}</dd></div>
                  <div><dt className="text-muted">Packaging</dt><dd>{labelOf(PACKAGING_STATUSES, gift.packagingStatus)}</dd></div>
                  <div><dt className="text-muted">Estimated total</dt><dd>{formatINR(lineTotal(gift.estimatedCost, gift.quantity))}</dd></div>
                  <div><dt className="text-muted">Actual total</dt><dd>{formatINR(lineTotal(gift.actualCost, gift.quantity))}</dd></div>
                </dl>
                {gift.notes ? <p className="mt-2 text-sm text-muted">{gift.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setEditing(gift)}>Edit</Button>
                  <Button variant="secondary" disabled={linked} onClick={() => update((current) => addGiftToShopping(current, gift.id))}>
                    {linked ? "On the shopping list" : "Add to shopping list"}
                  </Button>
                  <Button variant="danger" onClick={() => ask(`Delete this gift for ${gift.recipientName || "this recipient"}?`, "The gift record will be removed. A linked shopping item will stay.", () => update((current) => deleteGift(current, gift.id)))}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No gifts in this view" body="Add a recipient and describe the gift. You can assign it to one person or a whole family." action={<Button onClick={() => setCreating(true)}>Add a gift</Button>} />
      )}
      {creating ? <GiftForm people={state.people} presetOccasion={view === "bhaat" ? "Bhaat" : view === "returns" ? "Guest return gifts" : ""} onClose={() => setCreating(false)} onSave={(gift) => update((current) => saveGift(current, gift))} /> : null}
      {editing ? <GiftForm key={editing.id} initial={editing} people={state.people} onClose={() => setEditing(null)} onSave={(gift) => update((current) => saveGift(current, gift))} /> : null}
      {dialog}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link href={href} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${active ? "bg-maroon text-ivory" : "border border-line bg-white"}`} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function ReturnForm({
  plan,
  onSave,
}: {
  plan: { expectedQuantity: number | null; purchasedQuantity: number | null; distributedQuantity: number | null; costPerItem: number | null; notes: string };
  onSave: (plan: { expectedQuantity: number | null; purchasedQuantity: number | null; distributedQuantity: number | null; costPerItem: number | null; notes: string }) => void;
}) {
  const [expected, setExpected] = useState(plan.expectedQuantity == null ? "" : String(plan.expectedQuantity));
  const [purchased, setPurchased] = useState(plan.purchasedQuantity == null ? "" : String(plan.purchasedQuantity));
  const [distributed, setDistributed] = useState(plan.distributedQuantity == null ? "" : String(plan.distributedQuantity));
  const [cost, setCost] = useState(moneyOrBlank(plan.costPerItem));
  const [notes, setNotes] = useState(plan.notes);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const expectedQuantity = parseCount(expected, null);
    const purchasedQuantity = parseCount(purchased, null);
    const distributedQuantity = parseCount(distributed, null);
    const costPerItem = parseMoney(cost);
    if (!expectedQuantity.ok || !purchasedQuantity.ok || !distributedQuantity.ok || !costPerItem.ok) {
      setError("Use whole numbers for quantities. Cost can be blank.");
      return;
    }
    setError("");
    onSave({
      expectedQuantity: expectedQuantity.value,
      purchasedQuantity: purchasedQuantity.value,
      distributedQuantity: distributedQuantity.value,
      costPerItem: costPerItem.value,
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <FormGrid>
        <TextField label="Expected quantity" value={expected} onChange={setExpected} hint="How many return gifts you plan to need." />
        <TextField label="Purchased quantity" value={purchased} onChange={setPurchased} />
        <TextField label="Distributed quantity" value={distributed} onChange={setDistributed} />
        <MoneyField label="Cost per item" value={cost} onChange={setCost} />
      </FormGrid>
      <AreaField label="Notes" value={notes} onChange={setNotes} />
      <FormError message={error} />
      <Button type="submit">Save return gift numbers</Button>
    </form>
  );
}

function GiftForm({
  initial,
  people,
  presetOccasion = "",
  onClose,
  onSave,
}: {
  initial?: Gift;
  people: Person[];
  presetOccasion?: string;
  onClose: () => void;
  onSave: (gift: Gift) => void;
}) {
  const [recipientId, setRecipientId] = useState(initial?.recipientId ?? "");
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [relationship, setRelationship] = useState(initial?.relationship ?? "");
  const [occasion, setOccasion] = useState(initial?.occasion ?? presetOccasion);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedCost));
  const [actual, setActual] = useState(moneyOrBlank(initial?.actualCost));
  const [status, setStatus] = useState<GiftStatus>(initial?.status ?? "to_decide");
  const [packagingStatus, setPackagingStatus] = useState<PackagingStatus>(initial?.packagingStatus ?? "not_started");
  const [forFamily, setForFamily] = useState(initial?.forFamily ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!recipientName.trim() || !occasion || !description.trim()) {
      setError("Add the recipient, occasion, and a description of the gift.");
      return;
    }
    const qty = parseCount(quantity, 1);
    const estimatedCost = parseMoney(estimated);
    const actualCost = parseMoney(actual);
    if (!qty.ok || qty.value == null || qty.value < 1 || !estimatedCost.ok || !actualCost.ok) {
      setError("Quantity must be at least 1. Costs must be numbers or blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      recipientId,
      recipientName: recipientName.trim(),
      relationship: relationship.trim(),
      occasion,
      description: description.trim(),
      quantity: qty.value,
      estimatedCost: estimatedCost.value,
      actualCost: actualCost.value,
      status,
      packagingStatus,
      forFamily,
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit gift" : "Add a gift"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FormGrid>
          <PersonField
            label="Recipient in the family list"
            people={people}
            value={recipientId}
            onChange={(id) => {
              setRecipientId(id);
              const person = people.find((item) => item.id === id);
              if (person) {
                setRecipientName(person.name);
                setRelationship(person.relationship);
              }
            }}
          />
          <TextField label="Recipient name" required value={recipientName} onChange={setRecipientName} />
          <TextField label="Relationship" value={relationship} onChange={setRelationship} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Occasion <span className="text-maroon">*</span></span>
            <select className={inputClass} value={occasion} onChange={(event) => setOccasion(event.target.value)}>
              <option value="">Select</option>
              {GIFT_OCCASIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <TextField label="Gift description" required value={description} onChange={setDescription} className="sm:col-span-2" />
          <TextField label="Quantity" value={quantity} onChange={setQuantity} />
          <OptionField label="Status" value={status} onChange={setStatus} options={GIFT_STATUSES} />
          <MoneyField label="Estimated cost (per item)" value={estimated} onChange={setEstimated} />
          <MoneyField label="Actual cost (per item)" value={actual} onChange={setActual} />
          <OptionField label="Packaging status" value={packagingStatus} onChange={setPackagingStatus} options={PACKAGING_STATUSES} />
        </FormGrid>
        <CheckRow checked={forFamily} onChange={setForFamily} label="This gift is for the whole family, not one person" />
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
