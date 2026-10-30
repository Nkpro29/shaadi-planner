import { useMemo, useState } from 'react';
import { INVITATION_STATUSES, RSVP_STATUSES, STEP_STATUSES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, CheckList, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { guestStats, matchesQuery } from '../selectors';
import { useStore } from '../store';
import type { Guest, InvitationPlan, InvitationStatus, RsvpStatus, StepStatus } from '../types';
import { csvEscape, downloadText, parseCsv, uid } from '../utils';

function blankGuest(): Guest {
  return {
    id: uid(),
    name: '',
    household: '',
    relationshipGroup: '',
    city: '',
    memberCount: 1,
    phone: '',
    email: '',
    invitationStatus: 'Not Sent',
    rsvpStatus: 'Awaiting',
    eventIds: [],
    accommodation: '',
    notes: '',
    isDemo: false,
  };
}

export function GuestsPage() {
  const { state, addGuest, updateGuest, deleteGuest, importGuests, updateInvitation } = useStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [invite, setInvite] = useState('All');
  const [rsvp, setRsvp] = useState('All');
  const [draft, setDraft] = useState<Guest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const stats = guestStats(state);

  useOpenIntent({
    onCreate: () => {
      setError(null);
      setDraft(blankGuest());
    },
    onEdit: (id) => {
      const guest = state.guests.find((item) => item.id === id);
      if (guest) setDraft(guest);
    },
  });

  const rows = useMemo(
    () =>
      state.guests.filter((guest) => {
        if (invite !== 'All' && guest.invitationStatus !== invite) return false;
        if (rsvp !== 'All' && guest.rsvpStatus !== rsvp) return false;
        return matchesQuery(query, [guest.name, guest.household, guest.city, guest.relationshipGroup, guest.notes]);
      }),
    [invite, query, rsvp, state.guests],
  );

  function exportCsv() {
    const header = ['name', 'household', 'relationshipGroup', 'city', 'memberCount', 'phone', 'email', 'invitationStatus', 'rsvpStatus', 'events', 'accommodation', 'notes'];
    const lines = [header.join(',')];
    for (const guest of state.guests) {
      const events = guest.eventIds
        .map((id) => state.events.find((event) => event.id === id)?.name)
        .filter((name): name is string => Boolean(name))
        .join('|');
      lines.push(
        [
          guest.name,
          guest.household,
          guest.relationshipGroup,
          guest.city,
          guest.memberCount,
          guest.phone,
          guest.email,
          guest.invitationStatus,
          guest.rsvpStatus,
          events,
          guest.accommodation,
          guest.notes,
        ].map(csvEscape).join(','),
      );
    }
    downloadText('shaadisaathi-guests.csv', lines.join('\n'), 'text/csv');
  }

  async function importCsv(file: File) {
    const table = parseCsv(await file.text());
    if (table.length < 2) {
      setMessage('The file needs a header row and at least one guest.');
      return;
    }
    const header = table[0].map((cell) => cell.trim());
    const index = new Map(header.map((cell, i) => [cell, i]));
    const cell = (row: string[], key: string) => row[index.get(key) ?? -1]?.trim() ?? '';
    const imported: Guest[] = [];
    for (const row of table.slice(1)) {
      const name = cell(row, 'name');
      if (!name) continue;
      const invitationStatus = INVITATION_STATUSES.includes(cell(row, 'invitationStatus') as InvitationStatus)
        ? (cell(row, 'invitationStatus') as InvitationStatus)
        : 'Not Sent';
      const rsvpStatus = RSVP_STATUSES.includes(cell(row, 'rsvpStatus') as RsvpStatus)
        ? (cell(row, 'rsvpStatus') as RsvpStatus)
        : 'Awaiting';
      const eventIds = cell(row, 'events')
        .split('|')
        .map((namePart) => state.events.find((event) => event.name === namePart.trim())?.id)
        .filter((id): id is string => Boolean(id));
      imported.push({
        ...blankGuest(),
        id: uid(),
        name,
        household: cell(row, 'household'),
        relationshipGroup: cell(row, 'relationshipGroup'),
        city: cell(row, 'city'),
        memberCount: Math.max(1, Number(cell(row, 'memberCount')) || 1),
        phone: cell(row, 'phone'),
        email: cell(row, 'email'),
        invitationStatus,
        rsvpStatus,
        eventIds,
        accommodation: cell(row, 'accommodation'),
        notes: cell(row, 'notes'),
      });
    }
    if (!imported.length) {
      setMessage('No guests were found. Use the column name “name” in the header.');
      return;
    }
    importGuests(imported);
    setMessage(`${imported.length} guest${imported.length === 1 ? '' : 's'} added on this device. Nothing was emailed.`);
  }

  async function remove(guest: Guest) {
    const ok = await confirm({
      title: 'Delete this guest?',
      message: `${guest.name} will be removed from this device.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteGuest(guest.id);
  }

  return (
    <div className="page">
      <PageHeader
        title="Guests & Invitations"
        lede="Keep the guest list and card progress here. ShaadiSaathi does not send invitations or messages."
        actions={
          <>
            <button className="btn" type="button" onClick={exportCsv}>Export CSV</button>
            <label className="btn">
              Import CSV
              <input
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importCsv(file);
                  e.target.value = '';
                }}
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankGuest()); }}>Add guest</button>
          </>
        }
      />
      {message && <p className="hint">{message}</p>}
      <section className="stat-grid">
        <MiniStat label="Households" value={String(stats.households)} />
        <MiniStat label="Invitations sent" value={`${stats.invitedHouseholds} households · ${stats.invitedPeople} people`} />
        <MiniStat label="Invitations pending" value={String(stats.pendingHouseholds)} />
        <MiniStat label="Confirmed" value={`${stats.confirmedHouseholds} households · ${stats.confirmedPeople} people`} />
        <MiniStat label="Cannot attend" value={`${stats.declinedHouseholds} households · ${stats.declinedPeople} people`} />
      </section>

      <InvitationCard plan={state.invitation} onSave={updateInvitation} />

      <div className="filters">
        <SearchInput value={query} onChange={setQuery} placeholder="Search guests" />
        <Filter label="Invitation" value={invite} onChange={setInvite} options={['All', ...INVITATION_STATUSES]} />
        <Filter label="RSVP" value={rsvp} onChange={setRsvp} options={['All', ...RSVP_STATUSES]} />
      </div>
      {rows.length === 0 ? (
        <Empty title="No guests" text="Add households yourself, or import a CSV with a name column." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Group</th>
                <th>City</th>
                <th>People</th>
                <th>Invitation</th>
                <th>RSVP</th>
                <th>Events</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((guest) => (
                <tr key={guest.id}>
                  <td data-label="Guest">
                    <strong>{guest.name}</strong> <DemoBadge show={guest.isDemo} />
                    <div className="hint">{guest.household}{guest.accommodation ? ` · ${guest.accommodation}` : ''}</div>
                  </td>
                  <td data-label="Group">{guest.relationshipGroup || '—'}</td>
                  <td data-label="City">{guest.city || '—'}</td>
                  <td data-label="People">{guest.memberCount}</td>
                  <td data-label="Invitation"><Badge tone={toneFor(guest.invitationStatus)}>{guest.invitationStatus}</Badge></td>
                  <td data-label="RSVP"><Badge tone={toneFor(guest.rsvpStatus)}>{guest.rsvpStatus}</Badge></td>
                  <td data-label="Events">{guest.eventIds.map((id) => state.events.find((event) => event.id === id)?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(guest); }}>Edit</button>
                      <button className="btn btn-small" type="button" onClick={() => remove(guest)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <Modal title="Guest" wide onClose={() => setDraft(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!draft.name.trim()) {
                setError('Please enter the guest name.');
                return;
              }
              const saved = { ...draft, name: draft.name.trim(), memberCount: Math.max(1, draft.memberCount || 1) };
              if (state.guests.some((guest) => guest.id === saved.id)) updateGuest(saved);
              else addGuest(saved);
              setDraft(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Name"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Family or household"><TextInput value={draft.household} onChange={(e) => setDraft({ ...draft, household: e.target.value })} /></Field>
              <Field label="Relationship group"><TextInput value={draft.relationshipGroup} onChange={(e) => setDraft({ ...draft, relationshipGroup: e.target.value })} /></Field>
              <Field label="City or country"><TextInput value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
              <Field label="Number of family members"><TextInput inputMode="numeric" value={draft.memberCount} onChange={(e) => setDraft({ ...draft, memberCount: Math.max(1, Number(e.target.value) || 1) })} /></Field>
              <Field label="Phone"><TextInput value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
              <Field label="Email"><TextInput value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
              <Field label="Invitation status">
                <SelectInput value={draft.invitationStatus} onChange={(e) => setDraft({ ...draft, invitationStatus: e.target.value as InvitationStatus })}>
                  {INVITATION_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="RSVP status">
                <SelectInput value={draft.rsvpStatus} onChange={(e) => setDraft({ ...draft, rsvpStatus: e.target.value as RsvpStatus })}>
                  {RSVP_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Accommodation"><TextInput value={draft.accommodation} onChange={(e) => setDraft({ ...draft, accommodation: e.target.value })} /></Field>
              <div className="wide">
                <Field label="Events invited to">
                  <CheckList
                    options={state.events.map((event) => ({ id: event.id, label: event.name }))}
                    selected={draft.eventIds}
                    onChange={(eventIds) => setDraft({ ...draft, eventIds })}
                  />
                </Field>
              </div>
              <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save guest</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <article className="stat"><div className="stat-label">{label}</div><div className="stat-value" style={{ fontSize: '1.35rem' }}>{value}</div></article>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </SelectInput>
    </Field>
  );
}

const STEPS: { key: 'cardDesign' | 'textFinalization' | 'printing' | 'distribution' | 'digitalInvitation' | 'invitationVideo'; label: string }[] = [
  { key: 'cardDesign', label: 'Card design' },
  { key: 'textFinalization', label: 'Text finalization' },
  { key: 'printing', label: 'Printing' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'digitalInvitation', label: 'Digital invitation' },
  { key: 'invitationVideo', label: 'Invitation video' },
];

function InvitationCard({ plan, onSave }: { plan: InvitationPlan; onSave: (plan: InvitationPlan) => void }) {
  return (
    <section className="card">
      <h2>Invitation cards and video</h2>
      <p className="hint">Update each step when the family finishes it. Saving stays on this device.</p>
      <div className="form-grid" style={{ marginTop: 12 }}>
        {STEPS.map((step) => (
          <Field key={step.key} label={step.label}>
            <SelectInput
              value={plan[step.key]}
              onChange={(e) => onSave({ ...plan, [step.key]: e.target.value as StepStatus })}
            >
              {STEP_STATUSES.map((option) => <option key={option}>{option}</option>)}
            </SelectInput>
          </Field>
        ))}
        <Field label="Card quantity">
          <TextInput
            inputMode="numeric"
            value={plan.quantity ?? ''}
            onChange={(e) => onSave({ ...plan, quantity: e.target.value ? Math.max(0, Number(e.target.value) || 0) : null })}
          />
        </Field>
        <div className="wide">
          <Field label="Notes">
            <TextArea value={plan.notes} onChange={(e) => onSave({ ...plan, notes: e.target.value })} />
          </Field>
        </div>
      </div>
    </section>
  );
}
