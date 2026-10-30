import { useMemo, useState } from 'react';
import { MEDIA_STATUSES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { eventName, matchesQuery, memberName } from '../selectors';
import { useStore } from '../store';
import type { MediaItem, MediaStatus } from '../types';
import { amountToInput, formatDate, inr, parseAmount, uid } from '../utils';

function blankMedia(): MediaItem {
  return {
    id: uid(),
    name: '',
    eventId: null,
    responsibleId: null,
    vendor: '',
    deadline: null,
    estimatedCost: null,
    status: 'Planning',
    notes: '',
    link: '',
    isDemo: false,
  };
}

export function MediaPage() {
  const { state, addMedia, updateMedia, deleteMedia } = useStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [draft, setDraft] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useOpenIntent({
    onCreate: () => {
      setError(null);
      setDraft(blankMedia());
    },
    onEdit: (id) => {
      const item = state.media.find((row) => row.id === id);
      if (item) {
        setError(null);
        setDraft(item);
      }
    },
  });

  const rows = useMemo(
    () =>
      state.media.filter((item) => {
        if (status !== 'All' && item.status !== status) return false;
        return matchesQuery(query, [item.name, item.vendor, item.notes, item.link]);
      }),
    [query, state.media, status],
  );

  async function remove(item: MediaItem) {
    const ok = await confirm({
      title: 'Delete this item?',
      message: `${item.name} will be removed from this device.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteMedia(item.id);
  }

  return (
    <div className="page">
      <PageHeader
        title="Cards, Photos & Videos"
        lede="Track invitation design, films, and photo delivery. Links are references only — files are not uploaded."
        actions={<button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankMedia()); }}>Add item</button>}
      />
      <div className="filters">
        <SearchInput value={query} onChange={setQuery} placeholder="Search creative work" />
        <Field label="Status">
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            {MEDIA_STATUSES.map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
        </Field>
      </div>
      {rows.length === 0 ? (
        <Empty title="Nothing listed" text="Add cards, a photoshoot, or a film delivery date." />
      ) : (
        <div className="card-grid">
          {rows.map((item) => (
            <article key={item.id} className="card">
              <h2>{item.name} <DemoBadge show={item.isDemo} /></h2>
              <p><Badge tone={toneFor(item.status)}>{item.status}</Badge></p>
              <p className="hint">Event: {eventName(state, item.eventId)}</p>
              <p className="hint">Responsible: {memberName(state, item.responsibleId)}</p>
              <p className="hint">Vendor: {item.vendor || '—'}</p>
              <p className="hint">Deadline: {formatDate(item.deadline)} · Estimate {inr(item.estimatedCost)}</p>
              {item.notes && <p>{item.notes}</p>}
              {item.link && (
                <p><a href={item.link} target="_blank" rel="noreferrer">Open reference link</a></p>
              )}
              <div className="actions" style={{ marginTop: 10 }}>
                <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(item); }}>Edit</button>
                <button className="btn btn-small" type="button" onClick={() => remove(item)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {draft && (
        <Modal title="Creative item" wide onClose={() => setDraft(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!draft.name.trim()) {
                setError('Please name this item.');
                return;
              }
              if (draft.link && !/^https?:\/\//i.test(draft.link)) {
                setError('A reference link should start with http:// or https://.');
                return;
              }
              const saved = { ...draft, name: draft.name.trim() };
              if (state.media.some((item) => item.id === saved.id)) updateMedia(saved);
              else addMedia(saved);
              setDraft(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Item name"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Status">
                <SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as MediaStatus })}>
                  {MEDIA_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Related event">
                <SelectInput value={draft.eventId ?? ''} onChange={(e) => setDraft({ ...draft, eventId: e.target.value || null })}>
                  <option value="">None</option>
                  {state.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Responsible person">
                <SelectInput value={draft.responsibleId ?? ''} onChange={(e) => setDraft({ ...draft, responsibleId: e.target.value || null })}>
                  <option value="">Unassigned</option>
                  {state.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Vendor or designer"><TextInput value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} /></Field>
              <Field label="Deadline"><TextInput type="date" value={draft.deadline ?? ''} onChange={(e) => setDraft({ ...draft, deadline: e.target.value || null })} /></Field>
              <Field label="Estimated cost (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.estimatedCost)} onChange={(e) => setDraft({ ...draft, estimatedCost: parseAmount(e.target.value) })} /></Field>
              <Field label="Reference link"><TextInput value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://" /></Field>
              <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save item</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
