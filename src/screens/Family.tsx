import { useMemo, useState } from 'react';
import { ALTERATION_STATUSES, FAMILY_GROUPS, PURCHASE_STATUSES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { clothingAttention, eventName, isOverdue, isSoon, matchesQuery, memberName } from '../selectors';
import { useStore } from '../store';
import type { AlterationStatus, ClothingItem, FamilyGroup, FamilyMember, PurchaseStatus } from '../types';
import { amountToInput, formatDate, inr, parseAmount, uid } from '../utils';

function blankMember(): FamilyMember {
  return { id: uid(), name: '', relationship: '', group: "Bride's family", phone: '', email: '', notes: '', isDemo: false };
}

function blankClothing(personId?: string): ClothingItem {
  return {
    id: uid(),
    personId: personId ?? '',
    eventId: null,
    clothingType: '',
    estimatedPrice: null,
    actualPrice: null,
    shop: '',
    size: '',
    status: 'To Buy',
    fittingDate: null,
    alterationStatus: 'Not Needed',
    deliveryDeadline: null,
    notes: '',
    isDemo: false,
  };
}

export function FamilyPage() {
  const { state, addMember, updateMember, deleteMember, addClothing, updateClothing, deleteClothing, recordClothingExpense } = useStore();
  const confirm = useConfirm();
  const [tab, setTab] = useState<'people' | 'clothing'>('people');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const [person, setPerson] = useState('All');
  const [eventId, setEventId] = useState('All');
  const [status, setStatus] = useState('All');
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [outfit, setOutfit] = useState<ClothingItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attention = clothingAttention(state);

  useOpenIntent({
    onCreate: () => {
      setTab('people');
      setError(null);
      setMember(blankMember());
    },
    onEdit: (id) => {
      const clothing = state.clothing.find((item) => item.id === id);
      const found = state.members.find((item) => item.id === id);
      if (clothing) {
        setTab('clothing');
        setOutfit(clothing);
      } else if (found) {
        setTab('people');
        setMember(found);
      }
    },
  });

  const people = state.members.filter((item) => {
    if (group !== 'All' && item.group !== group) return false;
    return matchesQuery(query, [item.name, item.relationship, item.notes, item.phone]);
  });

  const outfits = useMemo(
    () =>
      state.clothing.filter((item) => {
        const owner = state.members.find((memberRow) => memberRow.id === item.personId);
        if (group !== 'All' && owner?.group !== group) return false;
        if (person !== 'All' && item.personId !== person) return false;
        if (eventId !== 'All' && item.eventId !== eventId) return false;
        if (status !== 'All' && item.status !== status) return false;
        return matchesQuery(query, [item.clothingType, item.shop, item.notes, owner?.name, item.size]);
      }),
    [eventId, group, person, query, state.clothing, state.members, status],
  );

  async function removeMember(item: FamilyMember) {
    const count = state.clothing.filter((outfitRow) => outfitRow.personId === item.id).length;
    const ok = await confirm({
      title: 'Remove this person?',
      message: count
        ? `${item.name} and ${count} clothing record${count === 1 ? '' : 's'} will be removed from this device.`
        : `${item.name} will be removed from this device.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) deleteMember(item.id);
  }

  async function removeOutfit(item: ClothingItem) {
    const ok = await confirm({
      title: 'Delete this clothing record?',
      message: 'This outfit requirement will be removed from this device.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteClothing(item.id);
  }

  return (
    <div className="page">
      <PageHeader
        title="Family & Clothing"
        lede="Track people on both sides, and only the outfits each person actually needs. One person can have a different outfit for each ceremony."
        actions={
          <>
            <button className="btn" type="button" onClick={() => { setError(null); setMember(blankMember()); }}>Add person</button>
            <button className="btn btn-primary" type="button" onClick={() => { setError(null); setOutfit(blankClothing()); setTab('clothing'); }}>Add outfit</button>
          </>
        }
      />
      <div className="tabs">
        <button className="btn" type="button" aria-pressed={tab === 'people'} onClick={() => setTab('people')}>Directory</button>
        <button className="btn" type="button" aria-pressed={tab === 'clothing'} onClick={() => setTab('clothing')}>Clothing</button>
      </div>
      {attention.length > 0 && (
        <div className="notice">
          {attention.length} outfit{attention.length === 1 ? '' : 's'} need attention — a fitting, alteration, or purchase deadline is due soon or overdue.
        </div>
      )}
      <div className="filters">
        <SearchInput value={query} onChange={setQuery} placeholder={tab === 'people' ? 'Search family' : 'Search clothing'} />
        <Mini label="Family" value={group} onChange={setGroup} options={['All', ...FAMILY_GROUPS]} />
        {tab === 'clothing' && (
          <>
            <Mini label="Person" value={person} onChange={setPerson} options={['All', ...state.members.map((item) => item.id)]} labels={Object.fromEntries(state.members.map((item) => [item.id, item.name]))} />
            <Mini label="Event" value={eventId} onChange={setEventId} options={['All', ...state.events.map((item) => item.id)]} labels={Object.fromEntries(state.events.map((item) => [item.id, item.name]))} />
            <Mini label="Purchase status" value={status} onChange={setStatus} options={['All', ...PURCHASE_STATUSES]} />
          </>
        )}
      </div>

      {tab === 'people' && (
        people.length === 0 ? <Empty title="No family members" text="Add the bride’s family, Benjamin’s family, and anyone else who needs an outfit or a gift." /> : (
          <div className="card-grid">
            {people.map((item) => {
              const outfitsFor = state.clothing.filter((outfitRow) => outfitRow.personId === item.id);
              return (
                <article key={item.id} className="card">
                  <h2>{item.name} <DemoBadge show={item.isDemo} /></h2>
                  <p>{item.relationship} · {item.group}</p>
                  {item.phone && <p className="hint">{item.phone}</p>}
                  {item.email && <p className="hint">{item.email}</p>}
                  {item.notes && <p className="hint">{item.notes}</p>}
                  <p className="hint">{outfitsFor.length === 0 ? 'No outfits listed.' : `${outfitsFor.length} outfit${outfitsFor.length === 1 ? '' : 's'}`}</p>
                  <div className="actions" style={{ marginTop: 10 }}>
                    <button className="btn btn-small" type="button" onClick={() => { setError(null); setMember(item); }}>Edit</button>
                    <button className="btn btn-small" type="button" onClick={() => { setOutfit(blankClothing(item.id)); setTab('clothing'); }}>Add outfit</button>
                    <button className="btn btn-small" type="button" onClick={() => removeMember(item)}>Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === 'clothing' && (
        outfits.length === 0 ? <Empty title="No clothing requirements" text="Add an outfit only for the person and ceremony that needs one." /> : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Event</th>
                  <th>Outfit</th>
                  <th>Status</th>
                  <th>Fitting</th>
                  <th>Alteration</th>
                  <th>Delivery</th>
                  <th>Estimate</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {outfits.map((item) => {
                  const flag = attention.some((row) => row.id === item.id);
                  return (
                    <tr key={item.id}>
                      <td data-label="Person">{memberName(state, item.personId)} <DemoBadge show={item.isDemo} /></td>
                      <td data-label="Event">{eventName(state, item.eventId)}</td>
                      <td data-label="Outfit">
                        <strong>{item.clothingType}</strong>
                        <div className="hint">{item.size ? `Size ${item.size}` : 'Size not set'}{item.shop ? ` · ${item.shop}` : ''}</div>
                        {flag && <Badge tone="warn">Needs attention</Badge>}
                      </td>
                      <td data-label="Status"><Badge tone={toneFor(item.status)}>{item.status}</Badge></td>
                      <td data-label="Fitting"><DateFlag value={item.fittingDate} /></td>
                      <td data-label="Alteration">{item.alterationStatus}</td>
                      <td data-label="Delivery"><DateFlag value={item.deliveryDeadline} /></td>
                      <td data-label="Estimate">{inr(item.estimatedPrice)}</td>
                      <td data-label="Actions">
                        <div className="actions">
                          <button className="btn btn-small" type="button" onClick={() => { setError(null); setOutfit(item); }}>Edit</button>
                          <button className="btn btn-small" type="button" onClick={() => recordClothingExpense(item.id)}>Expense</button>
                          <button className="btn btn-small" type="button" onClick={() => removeOutfit(item)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {member && (
        <Modal title="Family member" onClose={() => setMember(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!member.name.trim() || !member.relationship.trim()) {
                setError('Please enter a name and relationship.');
                return;
              }
              const saved = { ...member, name: member.name.trim(), relationship: member.relationship.trim() };
              if (state.members.some((item) => item.id === saved.id)) updateMember(saved);
              else addMember(saved);
              setMember(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Name"><TextInput value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} /></Field>
              <Field label="Relationship"><TextInput value={member.relationship} onChange={(e) => setMember({ ...member, relationship: e.target.value })} /></Field>
              <Field label="Family group">
                <SelectInput value={member.group} onChange={(e) => setMember({ ...member, group: e.target.value as FamilyGroup })}>
                  {FAMILY_GROUPS.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Phone"><TextInput value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} /></Field>
              <Field label="Email"><TextInput value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} /></Field>
              <div className="wide"><Field label="Notes"><TextArea value={member.notes} onChange={(e) => setMember({ ...member, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setMember(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save person</button>
            </div>
          </form>
        </Modal>
      )}

      {outfit && (
        <Modal title="Clothing requirement" wide onClose={() => setOutfit(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!outfit.personId || !outfit.clothingType.trim()) {
                setError('Choose a person and describe the outfit.');
                return;
              }
              const saved = { ...outfit, clothingType: outfit.clothingType.trim() };
              if (state.clothing.some((item) => item.id === saved.id)) updateClothing(saved);
              else addClothing(saved);
              setOutfit(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Person">
                <SelectInput value={outfit.personId} onChange={(e) => setOutfit({ ...outfit, personId: e.target.value })}>
                  <option value="">Choose a person</option>
                  {state.members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Event">
                <SelectInput value={outfit.eventId ?? ''} onChange={(e) => setOutfit({ ...outfit, eventId: e.target.value || null })}>
                  <option value="">Not tied to one event</option>
                  {state.events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Clothing type"><TextInput value={outfit.clothingType} onChange={(e) => setOutfit({ ...outfit, clothingType: e.target.value })} /></Field>
              <Field label="Size, if known"><TextInput value={outfit.size} onChange={(e) => setOutfit({ ...outfit, size: e.target.value })} /></Field>
              <Field label="Shop"><TextInput value={outfit.shop} onChange={(e) => setOutfit({ ...outfit, shop: e.target.value })} /></Field>
              <Field label="Purchase status">
                <SelectInput value={outfit.status} onChange={(e) => setOutfit({ ...outfit, status: e.target.value as PurchaseStatus })}>
                  {PURCHASE_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Estimated price (INR)"><TextInput inputMode="decimal" value={amountToInput(outfit.estimatedPrice)} onChange={(e) => setOutfit({ ...outfit, estimatedPrice: parseAmount(e.target.value) })} /></Field>
              <Field label="Actual price (INR)"><TextInput inputMode="decimal" value={amountToInput(outfit.actualPrice)} onChange={(e) => setOutfit({ ...outfit, actualPrice: parseAmount(e.target.value) })} /></Field>
              <Field label="Fitting date"><TextInput type="date" value={outfit.fittingDate ?? ''} onChange={(e) => setOutfit({ ...outfit, fittingDate: e.target.value || null })} /></Field>
              <Field label="Alteration status">
                <SelectInput value={outfit.alterationStatus} onChange={(e) => setOutfit({ ...outfit, alterationStatus: e.target.value as AlterationStatus })}>
                  {ALTERATION_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Delivery deadline"><TextInput type="date" value={outfit.deliveryDeadline ?? ''} onChange={(e) => setOutfit({ ...outfit, deliveryDeadline: e.target.value || null })} /></Field>
              <div className="wide"><Field label="Notes"><TextArea value={outfit.notes} onChange={(e) => setOutfit({ ...outfit, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setOutfit(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save outfit</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DateFlag({ value }: { value: string | null }) {
  if (!value) return <>—</>;
  const tone = isOverdue(value) ? 'bad' : isSoon(value) ? 'warn' : 'neutral';
  return <Badge tone={tone}>{formatDate(value)}</Badge>;
}

function Mini({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <Field label={label}>
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}
      </SelectInput>
    </Field>
  );
}
