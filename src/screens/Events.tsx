import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EVENT_STATUSES, EVENT_TEMPLATES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { eventSpending, memberName } from '../selectors';
import { useStore } from '../store';
import type { EventStatus, WeddingEvent } from '../types';
import { amountToInput, formatDate, inr, parseAmount, uid } from '../utils';

function blankEvent(templateName?: string): WeddingEvent {
  const template = EVENT_TEMPLATES.find((item) => item.name === templateName);
  return {
    id: uid(),
    name: template?.name ?? '',
    date: null,
    startTime: '',
    endTime: '',
    venue: '',
    description: template?.description ?? '',
    expectedGuests: null,
    budget: null,
    responsibleId: null,
    status: 'Planning',
    checklist: (template?.checklist ?? []).map((label) => ({ id: uid(), label, done: false })),
    vendors: '',
    notes: '',
    isDemo: false,
  };
}

export function EventsPage() {
  const navigate = useNavigate();
  const { state, addEvent, updateEvent, deleteEvent } = useStore();
  const confirm = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(state.events[0]?.id ?? null);
  const [draft, setDraft] = useState<WeddingEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkLabel, setCheckLabel] = useState('');
  const selected = state.events.find((event) => event.id === selectedId) ?? null;

  useOpenIntent({
    onCreate: () => {
      setError(null);
      setDraft(blankEvent());
    },
    onEdit: (id) => {
      const event = state.events.find((row) => row.id === id);
      if (!event) return;
      setSelectedId(id);
      setError(null);
      setDraft(event);
    },
  });

  async function remove(event: WeddingEvent) {
    const ok = await confirm({
      title: 'Delete this event?',
      message: 'Tasks and purchases stay, but they will no longer be linked to this ceremony.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteEvent(event.id);
    if (selectedId === event.id) setSelectedId(null);
  }

  const relatedTasks = selected ? state.tasks.filter((task) => task.eventId === selected.id) : [];
  const relatedPurchases = selected ? state.purchases.filter((item) => item.eventId === selected.id) : [];
  const spending = selected ? eventSpending(state, selected.id) : null;

  return (
    <div className="page">
      <PageHeader
        title="Events & Rituals"
        lede="Suggested ceremonies are a starting point. Keep, edit, or remove whatever does not fit your family."
        actions={
          <>
            <button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankEvent()); }}>Add event</button>
          </>
        }
      />
      <div className="filters">
        <Field label="Add a suggested ceremony">
          <SelectInput
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              const created = blankEvent(e.target.value);
              addEvent(created);
              setSelectedId(created.id);
              e.target.value = '';
            }}
          >
            <option value="">Choose a template</option>
            {EVENT_TEMPLATES.map((template) => <option key={template.name}>{template.name}</option>)}
          </SelectInput>
        </Field>
      </div>
      {state.events.length === 0 ? (
        <Empty title="No ceremonies yet" text="Add an event, or start from a suggestion such as Mehendi, Haldi, Sangeet, or the wedding." />
      ) : (
        <div className="dash-grid">
          <div className="stack">
            {state.events.map((event) => (
              <button
                key={event.id}
                type="button"
                className="event-card"
                onClick={() => setSelectedId(event.id)}
                style={event.id === selectedId ? { borderColor: 'var(--maroon)' } : undefined}
              >
                <strong>{event.name}</strong> <DemoBadge show={event.isDemo} />
                <div className="hint">{event.date ? formatDate(event.date) : 'Date not set'}{event.venue ? ` · ${event.venue}` : ''}</div>
                <Badge tone={toneFor(event.status)}>{event.status}</Badge>
              </button>
            ))}
          </div>
          {selected && (
            <article className="card">
              <div className="row">
                <h2>{selected.name}</h2>
                <DemoBadge show={selected.isDemo} />
              </div>
              <p className="lede">{selected.description || 'No description yet.'}</p>
              <div className="stack" style={{ marginTop: 12 }}>
                <p>When: {selected.date ? formatDate(selected.date) : 'Not set'}{selected.startTime ? `, ${selected.startTime}` : ''}{selected.endTime ? `–${selected.endTime}` : ''}</p>
                <p>Venue: {selected.venue || '—'}</p>
                <p>Responsible: {memberName(state, selected.responsibleId)}</p>
                <p>Expected guests: {selected.expectedGuests ?? '—'}</p>
                <p>Ceremony budget: {inr(selected.budget)}</p>
                <p>Spending recorded in the expense book: {inr(spending?.actual ?? 0)} actual, {inr(spending?.paid ?? 0)} paid</p>
                {selected.vendors && <p>Vendors: {selected.vendors}</p>}
                {selected.notes && <p>Notes: {selected.notes}</p>}
              </div>
              <h3 style={{ marginTop: 18 }}>Checklist</h3>
              <p className="hint">Suggestions only. Tick what applies, and add your own.</p>
              <div className="stack" style={{ marginTop: 8 }}>
                {selected.checklist.map((item) => (
                  <label key={item.id} className={item.done ? 'check on' : 'check'}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        updateEvent({
                          ...selected,
                          checklist: selected.checklist.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row)),
                        })
                      }
                    />
                    <span>{item.label}</span>
                    <button
                      className="btn btn-small right"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        updateEvent({ ...selected, checklist: selected.checklist.filter((row) => row.id !== item.id) });
                      }}
                    >
                      Remove
                    </button>
                  </label>
                ))}
                <div className="row">
                  <TextInput value={checkLabel} placeholder="Add a checklist item" onChange={(e) => setCheckLabel(e.target.value)} />
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      if (!checkLabel.trim()) return;
                      updateEvent({ ...selected, checklist: [...selected.checklist, { id: uid(), label: checkLabel.trim(), done: false }] });
                      setCheckLabel('');
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <h3 style={{ marginTop: 18 }}>Related tasks</h3>
              {relatedTasks.length === 0 && <p className="muted">No tasks linked yet.</p>}
              {relatedTasks.map((task) => <p key={task.id} className="mini">{task.title} · {task.status}</p>)}
              <h3 style={{ marginTop: 12 }}>Required purchases</h3>
              {relatedPurchases.length === 0 && <p className="muted">No purchases linked yet.</p>}
              {relatedPurchases.map((item) => <p key={item.id} className="mini">{item.name} · {item.status}</p>)}
              <div className="actions" style={{ marginTop: 16 }}>
                <button className="btn" type="button" onClick={() => { setError(null); setDraft(selected); }}>Edit event</button>
                <button className="btn" type="button" onClick={() => navigate('/tasks', { state: { compose: true, eventId: selected.id } })}>Add task</button>
                <button className="btn" type="button" onClick={() => navigate('/shopping', { state: { compose: true, eventId: selected.id } })}>Add purchase</button>
                <button className="btn" type="button" onClick={() => navigate('/budget', { state: { compose: true, eventId: selected.id } })}>Add expense</button>
                <button className="btn btn-danger" type="button" onClick={() => remove(selected)}>Delete</button>
              </div>
            </article>
          )}
        </div>
      )}
      {draft && (
        <EventForm
          draft={draft}
          error={error}
          members={state.members}
          onClose={() => setDraft(null)}
          onChange={setDraft}
          onSubmit={() => {
            if (!draft.name.trim()) {
              setError('Please enter the event name.');
              return;
            }
            const saved = { ...draft, name: draft.name.trim() };
            if (state.events.some((event) => event.id === saved.id)) updateEvent(saved);
            else addEvent(saved);
            setSelectedId(saved.id);
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}

function EventForm({
  draft,
  error,
  members,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: WeddingEvent;
  error: string | null;
  members: { id: string; name: string }[];
  onClose: () => void;
  onChange: (event: WeddingEvent) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<WeddingEvent>) => onChange({ ...draft, ...patch });
  return (
    <Modal title="Event" wide onClose={onClose}>
      <form onSubmit={(event) => { submitForm(event); onSubmit(); }}>
        <div className="modal-body form-grid">
          <FormError message={error} />
          <Field label="Event name">
            <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Status">
            <SelectInput value={draft.status} onChange={(e) => set({ status: e.target.value as EventStatus })}>
              {EVENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </SelectInput>
          </Field>
          <Field label="Date">
            <TextInput type="date" value={draft.date ?? ''} onChange={(e) => set({ date: e.target.value || null })} />
          </Field>
          <Field label="Responsible person">
            <SelectInput value={draft.responsibleId ?? ''} onChange={(e) => set({ responsibleId: e.target.value || null })}>
              <option value="">Unassigned</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Start time">
            <TextInput type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} />
          </Field>
          <Field label="End time">
            <TextInput type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} />
          </Field>
          <Field label="Venue">
            <TextInput value={draft.venue} onChange={(e) => set({ venue: e.target.value })} />
          </Field>
          <Field label="Expected guests">
            <TextInput
              inputMode="numeric"
              value={draft.expectedGuests ?? ''}
              onChange={(e) => set({ expectedGuests: e.target.value ? Math.max(0, Number(e.target.value) || 0) : null })}
            />
          </Field>
          <Field label="Ceremony budget (INR)" hint="Shown on this event. It is not added again on top of the expense book.">
            <TextInput inputMode="decimal" value={amountToInput(draft.budget)} onChange={(e) => set({ budget: parseAmount(e.target.value) })} />
          </Field>
          <div className="wide">
            <Field label="Description">
              <TextArea value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </div>
          <div className="wide">
            <Field label="Vendors" hint="One vendor per line, or a short note.">
              <TextArea value={draft.vendors} onChange={(e) => set({ vendors: e.target.value })} />
            </Field>
          </div>
          <div className="wide">
            <Field label="Notes">
              <TextArea value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save event</button>
        </div>
      </form>
    </Modal>
  );
}
