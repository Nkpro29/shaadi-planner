import { useMemo, useState } from 'react';
import { GIFT_KINDS, GIFT_STATUSES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { bhaatSummary, matchesQuery } from '../selectors';
import { useStore } from '../store';
import type { Gift, GiftKind, GiftStatus, ReturnGiftPlan } from '../types';
import { amountToInput, inr, lineTotal, parseAmount, uid } from '../utils';

function blankGift(): Gift {
  return {
    id: uid(),
    recipient: '',
    memberId: null,
    relationship: '',
    kind: 'Other',
    occasion: '',
    description: '',
    quantity: 1,
    estimatedCost: null,
    actualCost: null,
    status: 'To Decide',
    forFamily: false,
    notes: '',
    isDemo: false,
  };
}

export function GiftsPage() {
  const { state, addGift, updateGift, deleteGift, updateReturnGifts, recordGiftExpense } = useStore();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'all' | 'bhaat' | 'returns'>('all');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('All');
  const [status, setStatus] = useState('All');
  const [draft, setDraft] = useState<Gift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bhaat = bhaatSummary(state);
  const plan = state.returnGifts;

  useOpenIntent({
    onCreate: () => {
      setError(null);
      setDraft(blankGift());
    },
    onEdit: (id) => {
      const gift = state.gifts.find((item) => item.id === id);
      if (gift) setDraft(gift);
    },
  });

  const rows = useMemo(() => {
    return state.gifts.filter((gift) => {
      if (tab === 'bhaat' && gift.kind !== 'Bhaat') return false;
      if (kind !== 'All' && gift.kind !== kind) return false;
      if (status !== 'All' && gift.status !== status) return false;
      return matchesQuery(query, [gift.recipient, gift.relationship, gift.description, gift.occasion, gift.notes]);
    });
  }, [kind, query, state.gifts, status, tab]);

  async function remove(gift: Gift) {
    const ok = await confirm({
      title: 'Delete this gift?',
      message: `${gift.recipient || 'This gift'} will be removed from this device.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteGift(gift.id);
  }

  const short = plan.expectedQty > 0 && plan.purchasedQty < plan.expectedQty;
  const overGiven = plan.distributedQty > plan.purchasedQty;

  return (
    <div className="page">
      <PageHeader
        title="Gifts & Bhaat"
        lede="Record Mama gifts, gifts for Benjamin’s family, and guest return gifts the way your family actually does them."
        actions={<button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankGift()); }}>Add gift</button>}
      />
      <div className="tabs">
        <button className="btn" type="button" aria-pressed={tab === 'all'} onClick={() => setTab('all')}>All gifts</button>
        <button className="btn" type="button" aria-pressed={tab === 'bhaat'} onClick={() => setTab('bhaat')}>Bhaat</button>
        <button className="btn" type="button" aria-pressed={tab === 'returns'} onClick={() => setTab('returns')}>Guest return gifts</button>
      </div>

      {tab === 'bhaat' && (
        <section className="stat-grid">
          <Stat label="Recipients" value={String(bhaat.recipients)} />
          <Stat label="Gift lines" value={String(bhaat.gifts.length)} />
          <Stat label="Quantity required" value={String(bhaat.quantity)} />
          <Stat label="Quantity purchased" value={String(bhaat.purchasedQty)} />
          <Stat label="Quantity pending" value={String(bhaat.pendingQty)} />
          <Stat label="Estimated" value={inr(bhaat.estimated)} />
          <Stat label="Actual" value={inr(bhaat.actual)} />
        </section>
      )}

      {tab !== 'returns' && (
        <>
          <div className="filters">
            <SearchInput value={query} onChange={setQuery} placeholder="Search gifts" />
            {tab === 'all' && <Mini label="Occasion type" value={kind} onChange={setKind} options={['All', ...GIFT_KINDS]} />}
            <Mini label="Status" value={status} onChange={setStatus} options={['All', ...GIFT_STATUSES]} />
          </div>
          {rows.length === 0 ? (
            <Empty title="No gifts yet" text="Add a recipient, including a Mama or a whole family, and describe the gift." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Occasion</th>
                    <th>Gift</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Estimate</th>
                    <th>Actual</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((gift) => (
                    <tr key={gift.id}>
                      <td data-label="Recipient">
                        <strong>{gift.recipient}</strong> <DemoBadge show={gift.isDemo} />
                        <div className="hint">{gift.relationship}{gift.forFamily ? ' · Whole family' : ''}</div>
                      </td>
                      <td data-label="Occasion">{gift.occasion || gift.kind}</td>
                      <td data-label="Gift">{gift.description || '—'}</td>
                      <td data-label="Qty">{gift.quantity}</td>
                      <td data-label="Status"><Badge tone={toneFor(gift.status)}>{gift.status}</Badge></td>
                      <td data-label="Estimate">{inr(lineTotal(gift.estimatedCost, gift.quantity))}</td>
                      <td data-label="Actual">{inr(lineTotal(gift.actualCost, gift.quantity))}</td>
                      <td data-label="Actions">
                        <div className="actions">
                          <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(gift); }}>Edit</button>
                          <button className="btn btn-small" type="button" onClick={() => recordGiftExpense(gift.id)}>Expense</button>
                          <button className="btn btn-small" type="button" onClick={() => remove(gift)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'returns' && (
        <section className="card">
          <h2>Return gift quantities</h2>
          <p className="lede">Track how many pieces you expect, how many are bought, and how many have been handed out.</p>
          {(short || overGiven) && (
            <div className="notice" style={{ marginTop: 12 }}>
              {short && <p>Purchased quantity is less than the expected quantity.</p>}
              {overGiven && <p>Distributed quantity is higher than the purchased quantity.</p>}
            </div>
          )}
          <ReturnForm plan={plan} onSave={updateReturnGifts} />
          <p className="hint">
            Total from purchased quantity: {inr(plan.costPerItem == null ? null : plan.costPerItem * plan.purchasedQty)}.
            Remaining to buy: {Math.max(0, plan.expectedQty - plan.purchasedQty)}. Remaining to give: {Math.max(0, plan.purchasedQty - plan.distributedQty)}.
          </p>
        </section>
      )}

      {draft && (
        <Modal title="Gift" wide onClose={() => setDraft(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!draft.recipient.trim()) {
                setError('Please enter who receives the gift.');
                return;
              }
              const saved = { ...draft, recipient: draft.recipient.trim(), quantity: Math.max(1, draft.quantity || 1) };
              if (state.gifts.some((gift) => gift.id === saved.id)) updateGift(saved);
              else addGift(saved);
              setDraft(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Recipient"><TextInput value={draft.recipient} onChange={(e) => setDraft({ ...draft, recipient: e.target.value })} /></Field>
              <Field label="Relationship"><TextInput value={draft.relationship} onChange={(e) => setDraft({ ...draft, relationship: e.target.value })} /></Field>
              <Field label="Linked family member">
                <SelectInput value={draft.memberId ?? ''} onChange={(e) => setDraft({ ...draft, memberId: e.target.value || null })}>
                  <option value="">None</option>
                  {state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Gift type">
                <SelectInput
                  value={draft.kind}
                  onChange={(e) => {
                    const next = e.target.value as GiftKind;
                    setDraft({ ...draft, kind: next, occasion: draft.occasion || next });
                  }}
                >
                  {GIFT_KINDS.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Occasion" hint="Use Bhaat, Mehendi, or any family occasion.">
                <TextInput value={draft.occasion} onChange={(e) => setDraft({ ...draft, occasion: e.target.value })} />
              </Field>
              <Field label="Status">
                <SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as GiftStatus })}>
                  {GIFT_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <div className="wide"><Field label="Gift description"><TextArea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field></div>
              <Field label="Quantity"><TextInput inputMode="numeric" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Math.max(1, Number(e.target.value) || 1) })} /></Field>
              <label className="check">
                <input type="checkbox" checked={draft.forFamily} onChange={(e) => setDraft({ ...draft, forFamily: e.target.checked })} />
                <span>This gift is for a whole family, not one person</span>
              </label>
              <Field label="Estimated cost per gift (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.estimatedCost)} onChange={(e) => setDraft({ ...draft, estimatedCost: parseAmount(e.target.value) })} /></Field>
              <Field label="Actual cost per gift (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.actualCost)} onChange={(e) => setDraft({ ...draft, actualCost: parseAmount(e.target.value) })} /></Field>
              <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save gift</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </article>
  );
}

function Mini({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </SelectInput>
    </Field>
  );
}

function ReturnForm({ plan, onSave }: { plan: ReturnGiftPlan; onSave: (plan: ReturnGiftPlan) => void }) {
  const [draft, setDraft] = useState(plan);
  return (
    <form
      className="form-grid"
      style={{ marginTop: 16 }}
      onSubmit={(event) => {
        submitForm(event);
        onSave({
          ...draft,
          expectedQty: Math.max(0, draft.expectedQty || 0),
          purchasedQty: Math.max(0, draft.purchasedQty || 0),
          distributedQty: Math.max(0, draft.distributedQty || 0),
        });
      }}
    >
      <Field label="Item name"><TextInput value={draft.itemName} onChange={(e) => setDraft({ ...draft, itemName: e.target.value })} /></Field>
      <Field label="Cost per item (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.costPerItem)} onChange={(e) => setDraft({ ...draft, costPerItem: parseAmount(e.target.value) })} /></Field>
      <Field label="Expected quantity"><TextInput inputMode="numeric" value={draft.expectedQty} onChange={(e) => setDraft({ ...draft, expectedQty: Number(e.target.value) || 0 })} /></Field>
      <Field label="Purchased quantity"><TextInput inputMode="numeric" value={draft.purchasedQty} onChange={(e) => setDraft({ ...draft, purchasedQty: Number(e.target.value) || 0 })} /></Field>
      <Field label="Distributed quantity"><TextInput inputMode="numeric" value={draft.distributedQty} onChange={(e) => setDraft({ ...draft, distributedQty: Number(e.target.value) || 0 })} /></Field>
      <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field></div>
      <div><button className="btn btn-primary" type="submit">Save return gifts</button></div>
    </form>
  );
}
