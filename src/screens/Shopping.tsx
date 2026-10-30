import { useMemo, useState } from 'react';
import { PRIORITIES, PURCHASE_STATUSES, SHOPPING_CATEGORIES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, CheckList, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { eventName, matchesQuery, shopGroups } from '../selectors';
import { useStore } from '../store';
import type { Priority, Purchase, PurchaseStatus, ShoppingTrip } from '../types';
import { amountToInput, formatDate, inr, lineTotal, parseAmount, uid } from '../utils';

function blankPurchase(eventId?: string | null): Purchase {
  return {
    id: uid(),
    name: '',
    category: 'Miscellaneous',
    quantity: 1,
    recipient: '',
    eventId: eventId ?? null,
    estimatedPrice: null,
    actualPrice: null,
    shop: '',
    priority: 'Medium',
    deadline: null,
    status: 'To Buy',
    notes: '',
    tripId: null,
    isDemo: false,
  };
}

function blankTrip(purchaseIds: string[], shops: string): ShoppingTrip {
  return {
    id: uid(),
    name: '',
    date: null,
    departureTime: '',
    destination: '',
    travelTime: '',
    memberIds: [],
    shops,
    purchaseIds,
    notes: '',
    isDemo: false,
  };
}

export function ShoppingPage() {
  const { state, addPurchase, updatePurchase, deletePurchase, addTrip, updateTrip, deleteTrip, recordPurchaseExpense } = useStore();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'items' | 'trips' | 'shops'>('items');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState<Purchase | null>(null);
  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [openTrip, setOpenTrip] = useState<string | null>(state.trips[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  useOpenIntent({
    onCreate: (extra) => {
      setTab('items');
      setError(null);
      setDraft(blankPurchase(extra.eventId));
    },
    onEdit: (id) => {
      const purchase = state.purchases.find((item) => item.id === id);
      const foundTrip = state.trips.find((item) => item.id === id);
      if (purchase) {
        setTab('items');
        setDraft(purchase);
      } else if (foundTrip) {
        setTab('trips');
        setOpenTrip(foundTrip.id);
        setTrip(foundTrip);
      }
    },
  });

  const rows = useMemo(
    () =>
      state.purchases.filter((item) => {
        if (!matchesQuery(query, [item.name, item.shop, item.recipient, item.notes, item.category])) return false;
        if (category !== 'All' && item.category !== category) return false;
        if (status !== 'All' && item.status !== status) return false;
        if (priority !== 'All' && item.priority !== priority) return false;
        return true;
      }),
    [category, priority, query, state.purchases, status],
  );

  const groups = shopGroups(state.purchases);
  const activeTrip = state.trips.find((item) => item.id === openTrip) ?? null;

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((row) => row !== id) : [...current, id]));
  }

  function openTripForm(ids: string[]) {
    const items = state.purchases.filter((item) => ids.includes(item.id));
    const shops = [...new Set(items.map((item) => item.shop.trim()).filter(Boolean))].join(', ');
    setError(null);
    setTrip(blankTrip(ids, shops));
    setTab('trips');
  }

  async function removePurchase(item: Purchase) {
    const ok = await confirm({
      title: 'Delete this purchase?',
      message: `“${item.name}” will be removed from the list and from any trip.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deletePurchase(item.id);
  }

  async function removeTrip(item: ShoppingTrip) {
    const ok = await confirm({
      title: 'Delete this shopping trip?',
      message: 'The purchases stay on the shopping list. Only the trip is removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteTrip(item.id);
    if (openTrip === item.id) setOpenTrip(null);
  }

  return (
    <div className="page">
      <PageHeader
        title="Shopping List"
        lede="Group several purchases into one market trip. The market is about 30 minutes from home — enter that travel time yourself. This page does not plan a driving route."
        actions={<button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankPurchase()); }}>Add purchase</button>}
      />
      <div className="tabs">
        {([['items', 'Purchases'], ['trips', 'Shopping trips'], ['shops', 'Same shop']] as const).map(([id, label]) => (
          <button key={id} className="btn" type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          <div className="filters">
            <SearchInput value={query} onChange={setQuery} placeholder="Search purchases" />
            <MiniFilter label="Category" value={category} onChange={setCategory} options={['All', ...SHOPPING_CATEGORIES]} />
            <MiniFilter label="Status" value={status} onChange={setStatus} options={['All', ...PURCHASE_STATUSES]} />
            <MiniFilter label="Priority" value={priority} onChange={setPriority} options={['All', ...PRIORITIES]} />
          </div>
          {selected.length > 0 && (
            <div className="notice">
              {selected.length} selected · estimated {inr(sumSelected(state.purchases, selected))}
              <button className="btn btn-small" type="button" style={{ marginLeft: 12 }} onClick={() => openTripForm(selected)}>Plan a shopping trip</button>
            </div>
          )}
          {rows.length === 0 ? (
            <Empty title="No purchases" text="Add what the family still needs to buy." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th></th>
                    <th>Item</th>
                    <th>Shop</th>
                    <th>For</th>
                    <th>Qty</th>
                    <th>Estimate</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const pending = item.status === 'To Buy' || item.status === 'Shortlisted';
                    return (
                      <tr key={item.id}>
                        <td data-label="Select">
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.name}`}
                            disabled={!pending}
                            checked={selected.includes(item.id)}
                            onChange={() => toggle(item.id)}
                          />
                        </td>
                        <td data-label="Item">
                          <strong>{item.name}</strong> <DemoBadge show={item.isDemo} />
                          <div className="hint">{item.category}{item.eventId ? ` · ${eventName(state, item.eventId)}` : ''}{item.tripId ? ' · On a trip' : ''}</div>
                        </td>
                        <td data-label="Shop">{item.shop || '—'}</td>
                        <td data-label="For">{item.recipient || '—'}</td>
                        <td data-label="Qty">{item.quantity}</td>
                        <td data-label="Estimate">{inr(lineTotal(item.estimatedPrice, item.quantity))}</td>
                        <td data-label="Status">
                          <select aria-label={`Status for ${item.name}`} value={item.status} onChange={(e) => updatePurchase({ ...item, status: e.target.value as PurchaseStatus })}>
                            {PURCHASE_STATUSES.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </td>
                        <td data-label="Deadline">{formatDate(item.deadline)}</td>
                        <td data-label="Actions">
                          <div className="actions">
                            <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(item); }}>Edit</button>
                            <button className="btn btn-small" type="button" onClick={() => removePurchase(item)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'trips' && (
        <div className="dash-grid">
          <div className="stack">
            <button className="btn" type="button" onClick={() => openTripForm(selected)}>New trip from selected purchases</button>
            {state.trips.length === 0 && <Empty title="No trips yet" text="Select purchases on the Purchases tab, then plan one trip." />}
            {state.trips.map((item) => (
              <button key={item.id} type="button" className="trip-card" onClick={() => setOpenTrip(item.id)} style={item.id === openTrip ? { borderColor: 'var(--maroon)' } : undefined}>
                <strong>{item.name}</strong> <DemoBadge show={item.isDemo} />
                <div className="hint">{item.date ? formatDate(item.date) : 'Date not set'} · {item.destination || 'Destination not set'}</div>
                <div className="hint">{item.purchaseIds.length} purchases · {inr(sumSelected(state.purchases, item.purchaseIds))}</div>
              </button>
            ))}
          </div>
          {activeTrip && (
            <TripDetail
              trip={activeTrip}
              purchases={state.purchases}
              members={state.members}
              onEdit={() => { setError(null); setTrip(activeTrip); }}
              onDelete={() => removeTrip(activeTrip)}
              onUpdatePurchase={updatePurchase}
              onRecord={recordPurchaseExpense}
              linkedIds={new Set(state.expenses.map((expense) => expense.linkedPurchaseId).filter((id): id is string => Boolean(id)))}
            />
          )}
        </div>
      )}

      {tab === 'shops' && (
        <div className="stack">
          <p className="muted">Purchases that name the same shop can be combined into one trip. Shops are grouped from what you typed. Routes are not calculated.</p>
          {groups.length === 0 && <Empty title="No open purchases" text="Items marked To Buy or Shortlisted appear here." />}
          {groups.map((group) => (
            <article key={group.shop} className="card">
              <div className="row">
                <h2>{group.shop}</h2>
                <button className="btn right" type="button" onClick={() => openTripForm(group.items.map((item) => item.id))}>Plan a trip</button>
              </div>
              <p className="hint">{group.items.length} items · estimated {inr(sumSelected(state.purchases, group.items.map((item) => item.id)))}</p>
              {group.items.map((item) => (
                <p key={item.id} className="mini">{item.name} · {item.recipient || 'No recipient'} · {item.priority}</p>
              ))}
            </article>
          ))}
        </div>
      )}

      {draft && (
        <PurchaseForm
          draft={draft}
          error={error}
          events={state.events}
          onClose={() => setDraft(null)}
          onChange={setDraft}
          onSubmit={() => {
            if (!draft.name.trim()) {
              setError('Please enter the item name.');
              return;
            }
            const saved = { ...draft, name: draft.name.trim(), quantity: Math.max(1, draft.quantity || 1) };
            if (state.purchases.some((item) => item.id === saved.id)) updatePurchase(saved);
            else addPurchase(saved);
            setDraft(null);
          }}
        />
      )}
      {trip && (
        <TripForm
          trip={trip}
          error={error}
          purchases={state.purchases}
          members={state.members}
          onClose={() => setTrip(null)}
          onChange={setTrip}
          onSubmit={() => {
            if (!trip.name.trim()) {
              setError('Please name the shopping trip.');
              return;
            }
            const saved = { ...trip, name: trip.name.trim() };
            if (state.trips.some((item) => item.id === saved.id)) updateTrip(saved);
            else addTrip(saved);
            setOpenTrip(saved.id);
            setSelected([]);
            setTrip(null);
            setTab('trips');
          }}
        />
      )}
    </div>
  );
}

function sumSelected(purchases: Purchase[], ids: string[]) {
  return purchases
    .filter((item) => ids.includes(item.id))
    .reduce((total, item) => total + (lineTotal(item.estimatedPrice, item.quantity) ?? 0), 0);
}

function MiniFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </SelectInput>
    </Field>
  );
}

function TripDetail({
  trip,
  purchases,
  members,
  onEdit,
  onDelete,
  onUpdatePurchase,
  onRecord,
  linkedIds,
}: {
  trip: ShoppingTrip;
  purchases: Purchase[];
  members: { id: string; name: string }[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePurchase: (item: Purchase) => void;
  onRecord: (id: string) => void;
  linkedIds: Set<string>;
}) {
  const items = purchases.filter((item) => trip.purchaseIds.includes(item.id));
  const people = trip.memberIds.map((id) => members.find((member) => member.id === id)?.name ?? 'Removed person').join(', ');
  return (
    <article className="card">
      <h2>{trip.name}</h2>
      <DemoBadge show={trip.isDemo} />
      <div className="stack" style={{ marginTop: 8 }}>
        <p>Date: {trip.date ? formatDate(trip.date) : 'Not set'}{trip.departureTime ? ` · departs ${trip.departureTime}` : ''}</p>
        <p>Destination: {trip.destination || '—'}</p>
        <p>Travel time: {trip.travelTime || '—'}</p>
        <p>Going: {people || '—'}</p>
        <p>Shops: {trip.shops || '—'}</p>
        <p>Estimated total: {inr(sumSelected(purchases, trip.purchaseIds))}</p>
        {trip.notes && <p>Notes: {trip.notes}</p>}
      </div>
      <h3 style={{ marginTop: 16 }}>Purchases on this trip</h3>
      {items.length === 0 && <p className="muted">No purchases are attached.</p>}
      {items.map((item) => (
        <div key={item.id} className="mini">
          <div>
            <strong>{item.name}</strong>
            <div className="hint">{item.shop || 'Shop not set'} · est. {inr(lineTotal(item.estimatedPrice, item.quantity))}</div>
            <div className="actions" style={{ marginTop: 6 }}>
              <select aria-label={`Status for ${item.name}`} value={item.status} onChange={(e) => onUpdatePurchase({ ...item, status: e.target.value as PurchaseStatus })}>
                {PURCHASE_STATUSES.map((option) => <option key={option}>{option}</option>)}
              </select>
              <TextInput
                aria-label={`Actual price for ${item.name}`}
                placeholder="Actual price"
                inputMode="decimal"
                value={amountToInput(item.actualPrice)}
                onChange={(e) => onUpdatePurchase({ ...item, actualPrice: parseAmount(e.target.value) })}
              />
              <button className="btn btn-small" type="button" onClick={() => onRecord(item.id)}>
                {linkedIds.has(item.id) ? 'Update expense book' : 'Add to expense book'}
              </button>
            </div>
          </div>
          <Badge tone={toneFor(item.status)}>{item.status}</Badge>
        </div>
      ))}
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn" type="button" onClick={onEdit}>Edit trip</button>
        <button className="btn btn-danger" type="button" onClick={onDelete}>Delete trip</button>
      </div>
    </article>
  );
}

function PurchaseForm({
  draft,
  error,
  events,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: Purchase;
  error: string | null;
  events: { id: string; name: string }[];
  onClose: () => void;
  onChange: (item: Purchase) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<Purchase>) => onChange({ ...draft, ...patch });
  return (
    <Modal title="Purchase" wide onClose={onClose}>
      <form onSubmit={(event) => { submitForm(event); onSubmit(); }}>
        <div className="modal-body form-grid">
          <FormError message={error} />
          <Field label="Item name"><TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Category">
            <SelectInput value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {SHOPPING_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
            </SelectInput>
          </Field>
          <Field label="Quantity"><TextInput inputMode="numeric" value={draft.quantity} onChange={(e) => set({ quantity: Math.max(1, Number(e.target.value) || 1) })} /></Field>
          <Field label="Intended recipient"><TextInput value={draft.recipient} onChange={(e) => set({ recipient: e.target.value })} /></Field>
          <Field label="Related event">
            <SelectInput value={draft.eventId ?? ''} onChange={(e) => set({ eventId: e.target.value || null })}>
              <option value="">None</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Shop name"><TextInput value={draft.shop} onChange={(e) => set({ shop: e.target.value })} /></Field>
          <Field label="Estimated price (per item, INR)"><TextInput inputMode="decimal" value={amountToInput(draft.estimatedPrice)} onChange={(e) => set({ estimatedPrice: parseAmount(e.target.value) })} /></Field>
          <Field label="Actual price (per item, INR)"><TextInput inputMode="decimal" value={amountToInput(draft.actualPrice)} onChange={(e) => set({ actualPrice: parseAmount(e.target.value) })} /></Field>
          <Field label="Priority">
            <SelectInput value={draft.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
              {PRIORITIES.map((option) => <option key={option}>{option}</option>)}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={draft.status} onChange={(e) => set({ status: e.target.value as PurchaseStatus })}>
              {PURCHASE_STATUSES.map((option) => <option key={option}>{option}</option>)}
            </SelectInput>
          </Field>
          <Field label="Deadline"><TextInput type="date" value={draft.deadline ?? ''} onChange={(e) => set({ deadline: e.target.value || null })} /></Field>
          <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => set({ notes: e.target.value })} /></Field></div>
          <p className="hint wide">Line estimate: {inr(lineTotal(draft.estimatedPrice, draft.quantity))}. Actual line: {inr(lineTotal(draft.actualPrice, draft.quantity))}.</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save purchase</button>
        </div>
      </form>
    </Modal>
  );
}

function TripForm({
  trip,
  error,
  purchases,
  members,
  onClose,
  onChange,
  onSubmit,
}: {
  trip: ShoppingTrip;
  error: string | null;
  purchases: Purchase[];
  members: { id: string; name: string }[];
  onClose: () => void;
  onChange: (trip: ShoppingTrip) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<ShoppingTrip>) => onChange({ ...trip, ...patch });
  const choices = purchases.filter((item) => item.status !== 'Cancelled' && item.status !== 'Delivered');
  return (
    <Modal title="Shopping trip" subtitle="Estimated total is the sum of the selected items. Travel time is what you enter." wide onClose={onClose}>
      <form onSubmit={(event) => { submitForm(event); onSubmit(); }}>
        <div className="modal-body form-grid">
          <FormError message={error} />
          <Field label="Trip name"><TextInput value={trip.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Date"><TextInput type="date" value={trip.date ?? ''} onChange={(e) => set({ date: e.target.value || null })} /></Field>
          <Field label="Departure time"><TextInput type="time" value={trip.departureTime} onChange={(e) => set({ departureTime: e.target.value })} /></Field>
          <Field label="Destination or market"><TextInput value={trip.destination} onChange={(e) => set({ destination: e.target.value })} /></Field>
          <Field label="Travel time" hint="For example, 30 minutes from home."><TextInput value={trip.travelTime} onChange={(e) => set({ travelTime: e.target.value })} /></Field>
          <Field label="Shops to visit"><TextInput value={trip.shops} onChange={(e) => set({ shops: e.target.value })} /></Field>
          <div className="wide">
            <Field label="Family members going">
              <CheckList
                options={members.map((member) => ({ id: member.id, label: member.name }))}
                selected={trip.memberIds}
                onChange={(memberIds) => set({ memberIds })}
              />
            </Field>
          </div>
          <div className="wide">
            <Field label="Purchases on this trip">
              <CheckList
                options={choices.map((item) => ({ id: item.id, label: `${item.name}${item.shop ? ` · ${item.shop}` : ''}` }))}
                selected={trip.purchaseIds}
                onChange={(purchaseIds) => set({ purchaseIds })}
              />
            </Field>
          </div>
          <p className="wide">Estimated total: {inr(sumSelected(purchases, trip.purchaseIds))}</p>
          <div className="wide"><Field label="Notes"><TextArea value={trip.notes} onChange={(e) => set({ notes: e.target.value })} /></Field></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save trip</button>
        </div>
      </form>
    </Modal>
  );
}
