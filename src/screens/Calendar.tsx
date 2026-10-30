import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, FormError, Modal, PageHeader, SelectInput, TextArea, TextInput, submitForm, useConfirm } from '../components/ui';
import { agendaOn, collectAgenda, overdueTasks, pendingPurchases, upcomingEvents } from '../selectors';
import { useStore } from '../store';
import type { AgendaItem, AgendaSource, CalendarEntry, CalendarKind } from '../types';
import { addDays, formatDate, formatDateLong, monthLabel, todayISO, uid, weekday } from '../utils';

type View = 'month' | 'week' | 'day' | 'agenda';
type CreateKind = 'Task' | 'Event' | 'Shopping trip' | 'Appointment' | 'Payment reminder' | 'Note';

interface Draft {
  mode: 'create' | 'edit';
  source: AgendaSource | null;
  sourceId: string | null;
  createKind: CreateKind;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const CREATE_KINDS: CreateKind[] = ['Task', 'Event', 'Shopping trip', 'Appointment', 'Payment reminder', 'Note'];

export function CalendarPage() {
  const navigate = useNavigate();
  const store = useStore();
  const confirm = useConfirm();
  const { state } = store;
  const today = todayISO();
  const [cursor, setCursor] = useState(today);
  const [view, setView] = useState<View>('month');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = useMemo(() => collectAgenda(state), [state]);
  const byDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  const [year, month] = cursor.split('-').map(Number);
  const monthCells = buildMonth(year, month - 1);
  const weekStart = startOfWeek(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function openCreate(date: string) {
    setError(null);
    setDraft({
      mode: 'create',
      source: null,
      sourceId: null,
      createKind: 'Appointment',
      title: '',
      date,
      startTime: '',
      endTime: '',
      notes: '',
    });
  }

  function openEdit(item: AgendaItem) {
    setError(null);
    const notes = notesFor(state, item);
    setDraft({
      mode: 'edit',
      source: item.source,
      sourceId: item.sourceId,
      createKind: 'Appointment',
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      notes,
    });
  }

  function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!draft.date) {
      setError('Please choose a date.');
      return;
    }
    if (draft.mode === 'create') {
      createRecord(store, draft);
      setDraft(null);
      return;
    }
    updateRecord(store, draft);
    setDraft(null);
  }

  function clearDate() {
    if (!draft?.source || !draft.sourceId) return;
    updateRecord(store, { ...draft, date: '' });
    setDraft(null);
  }

  const upcoming = upcomingEvents(state, 6);
  const dueToday = state.tasks.filter((task) => task.deadline === today && task.status !== 'Completed');
  const overdue = overdueTasks(state);
  const tripsToday = state.trips.filter((trip) => trip.date === today);
  const shoppingDue = pendingPurchases(state).filter((item) => item.deadline === today);
  const soonDeadlines = items.filter((item) => {
    if (!['Payment', 'Creative deadline', 'Delivery', 'Fitting', 'Purchase deadline'].includes(item.kindLabel)) return false;
    return item.date >= today && item.date <= addDays(today, 3);
  });

  return (
    <div className="page">
      <PageHeader
        title="Calendar"
        lede="Events, task deadlines, shopping trips, fittings, and payments. Times use Asia/Kolkata. Editing an item updates the original record."
        actions={<button className="btn btn-primary" type="button" onClick={() => openCreate(cursor)}>Add to calendar</button>}
      />

      <section className="card">
        <h2>Today’s plan</h2>
        <p className="hint">{formatDateLong(today)}</p>
        <div className="card-grid" style={{ marginTop: 12 }}>
          <PlanList title="Tasks due today" rows={dueToday.map((task) => task.title)} empty="No tasks are due today." />
          <PlanList title="Upcoming events" rows={upcoming.map((event) => `${event.name} · ${formatDate(event.date)}`)} empty="No dated events in the list." />
          <PlanList
            title="Shopping"
            rows={[
              ...tripsToday.map((trip) => trip.name),
              ...shoppingDue.map((item) => `Buy: ${item.name}`),
            ]}
            empty="No shopping trip or purchase is due today."
          />
          <PlanList
            title="Deadlines in the next 3 days"
            rows={soonDeadlines.map((item) => `${formatDate(item.date)} · ${item.title}`)}
            empty="No payment, fitting, or creative deadline is close."
          />
        </div>
        {overdue.length > 0 && (
          <div className="notice" style={{ marginTop: 12 }}>
            Overdue tasks: {overdue.map((task) => task.title).join(', ')}
          </div>
        )}
      </section>

      <div className="row">
        <div className="segmented" role="tablist" aria-label="Calendar view">
          {(['month', 'week', 'day', 'agenda'] as View[]).map((item) => (
            <button key={item} className="btn" type="button" aria-pressed={view === item} onClick={() => setView(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <div className="actions right">
          <button className="btn" type="button" onClick={() => setCursor(shift(cursor, view, -1))}>Previous</button>
          <button className="btn" type="button" onClick={() => setCursor(today)}>Today</button>
          <button className="btn" type="button" onClick={() => setCursor(shift(cursor, view, 1))}>Next</button>
        </div>
      </div>
      <p className="muted">{view === 'month' ? monthLabel(year, month - 1) : formatDateLong(cursor)}</p>

      {view === 'month' && (
        <div>
          <div className="cal-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="cal-dow">{day}</div>
            ))}
          </div>
          <div className="cal-grid">
            {monthCells.map((date, index) => {
              const list = date ? byDate.get(date) ?? [] : [];
              return (
                <button
                  key={date ?? `empty-${index}`}
                  type="button"
                  className={!date ? 'cal-cell out' : date === today ? 'cal-cell today' : 'cal-cell'}
                  disabled={!date}
                  onClick={() => date && setCursor(date)}
                  onDoubleClick={() => date && openCreate(date)}
                >
                  {date && (
                    <>
                      <span className="date-num">{Number(date.slice(-2))}</span>
                      <span className="cal-count">{list.length ? `${list.length} items` : ''}</span>
                      {list.slice(0, 3).map((item) => (
                        <span
                          key={item.key}
                          className="cal-pill"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          {item.title}
                        </span>
                      ))}
                      {list.length > 3 && <span className="more">+{list.length - 3} more</span>}
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <p className="hint">Select a day, then use Day view or Add to calendar. Double-click a day to add something. Click an item to edit it in place.</p>
          <DayList date={cursor} items={byDate.get(cursor) ?? []} onEdit={openEdit} onCreate={() => openCreate(cursor)} />
        </div>
      )}

      {view === 'week' && (
        <div className="week-grid">
          {weekDays.map((date) => (
            <div key={date} className={date === today ? 'day-col today' : 'day-col'}>
              <button className="btn btn-small" type="button" onClick={() => { setCursor(date); setView('day'); }}>
                {weekday(date)} {formatDate(date)}
              </button>
              <div className="stack" style={{ marginTop: 8 }}>
                {(byDate.get(date) ?? []).map((item) => (
                  <button key={item.key} className="cal-pill" type="button" onClick={() => openEdit(item)}>
                    {item.startTime ? `${item.startTime} ` : ''}{item.title}
                  </button>
                ))}
                <button className="btn btn-small" type="button" onClick={() => openCreate(date)}>Add</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <DayList date={cursor} items={agendaOn(state, cursor)} onEdit={openEdit} onCreate={() => openCreate(cursor)} />
      )}

      {view === 'agenda' && (
        <div className="card">
          {items.filter((item) => item.date >= today && item.date <= addDays(today, 60)).length === 0 && (
            <p className="muted">Nothing is dated in the next 60 days.</p>
          )}
          {items
            .filter((item) => item.date >= today && item.date <= addDays(today, 60))
            .map((item) => (
              <button key={item.key} className="list-row linkish" type="button" onClick={() => openEdit(item)}>
                <span>
                  <strong>{item.title}</strong>
                  <span className="hint">{formatDate(item.date)} · {item.kindLabel}{item.startTime ? ` · ${item.startTime}` : ''}</span>
                </span>
              </button>
            ))}
        </div>
      )}

      {draft && (
        <Modal
          title={draft.mode === 'create' ? 'Add to the calendar' : 'Edit calendar item'}
          subtitle="This updates one record. It will not create a second copy."
          onClose={() => setDraft(null)}
        >
          <form onSubmit={(event) => { submitForm(event); save(); }}>
            <div className="modal-body form-grid">
              <FormError message={error} />
              {draft.mode === 'create' && (
                <div className="wide">
                  <Field label="What are you adding?">
                    <SelectInput value={draft.createKind} onChange={(e) => setDraft({ ...draft, createKind: e.target.value as CreateKind })}>
                      {CREATE_KINDS.map((kind) => <option key={kind}>{kind}</option>)}
                    </SelectInput>
                  </Field>
                </div>
              )}
              <Field label="Title">
                <TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </Field>
              <Field label="Date">
                <TextInput type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </Field>
              <Field label="Start time">
                <TextInput type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
              </Field>
              <Field label="End time">
                <TextInput type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
              </Field>
              <div className="wide">
                <Field label="Notes">
                  <TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="modal-foot">
              {draft.mode === 'edit' && draft.source && draft.sourceId && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => navigate(pathFor(draft.source as AgendaSource), { state: { editId: draft.sourceId } })}
                >
                  Open full details
                </button>
              )}
              {draft.mode === 'edit' && draft.source !== 'entry' && (
                <button className="btn" type="button" onClick={clearDate}>Remove date</button>
              )}
              {draft.mode === 'edit' && draft.source === 'entry' && (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Delete this calendar note?',
                      message: 'This removes the note from this device.',
                      confirmLabel: 'Delete',
                      danger: true,
                    });
                    if (!ok || !draft.sourceId) return;
                    store.deleteEntry(draft.sourceId);
                    setDraft(null);
                  }}
                >
                  Delete note
                </button>
              )}
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function PlanList({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return (
    <div>
      <h3>{title}</h3>
      {rows.length === 0 ? <p className="muted">{empty}</p> : rows.map((row) => <p key={row} className="mini">{row}</p>)}
    </div>
  );
}

function DayList({
  date,
  items,
  onEdit,
  onCreate,
}: {
  date: string;
  items: AgendaItem[];
  onEdit: (item: AgendaItem) => void;
  onCreate: () => void;
}) {
  return (
    <section className="card">
      <div className="row">
        <h2>{weekday(date)} {formatDateLong(date)}</h2>
        <button className="btn right" type="button" onClick={onCreate}>Add on this day</button>
      </div>
      {items.length === 0 && <p className="muted">Nothing is planned for this day.</p>}
      {items.map((item) => (
        <button key={item.key} className="list-row linkish" type="button" onClick={() => onEdit(item)}>
          <span>
            <strong>{item.title}</strong>
            <span className="hint">{item.kindLabel}{item.startTime ? ` · ${item.startTime}` : ''}{item.endTime ? `–${item.endTime}` : ''}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

function pathFor(source: AgendaSource) {
  if (source === 'task') return '/tasks';
  if (source === 'event') return '/events';
  if (source === 'trip' || source === 'purchase') return '/shopping';
  if (source === 'clothing-fitting' || source === 'clothing-delivery') return '/family';
  if (source === 'expense') return '/budget';
  if (source === 'media') return '/media';
  return '/calendar';
}

function notesFor(state: ReturnType<typeof useStore>['state'], item: AgendaItem) {
  if (item.source === 'entry') return state.entries.find((entry) => entry.id === item.sourceId)?.notes ?? '';
  if (item.source === 'task') return state.tasks.find((task) => task.id === item.sourceId)?.notes ?? '';
  if (item.source === 'event') return state.events.find((event) => event.id === item.sourceId)?.notes ?? '';
  if (item.source === 'trip') return state.trips.find((trip) => trip.id === item.sourceId)?.notes ?? '';
  return '';
}

function createRecord(store: ReturnType<typeof useStore>, draft: Draft) {
  const title = draft.title.trim();
  if (draft.createKind === 'Task') {
    store.addTask({
      id: uid(),
      title,
      description: '',
      category: 'Miscellaneous',
      assigneeId: null,
      priority: 'Medium',
      status: 'Not Started',
      deadline: draft.date,
      estimatedCost: null,
      notes: draft.notes,
      eventId: null,
      isDemo: false,
    });
    return;
  }
  if (draft.createKind === 'Event') {
    store.addEvent({
      id: uid(),
      name: title,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      venue: '',
      description: '',
      expectedGuests: null,
      budget: null,
      responsibleId: null,
      status: 'Planning',
      checklist: [],
      vendors: '',
      notes: draft.notes,
      isDemo: false,
    });
    return;
  }
  if (draft.createKind === 'Shopping trip') {
    store.addTrip({
      id: uid(),
      name: title,
      date: draft.date,
      departureTime: draft.startTime,
      destination: '',
      travelTime: '',
      memberIds: [],
      shops: '',
      purchaseIds: [],
      notes: draft.notes,
      isDemo: false,
    });
    return;
  }
  const kind: CalendarKind =
    draft.createKind === 'Payment reminder' ? 'Payment deadline' : draft.createKind === 'Note' ? 'Note' : 'Appointment';
  const entry: CalendarEntry = {
    id: uid(),
    title,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    kind,
    notes: draft.notes,
    isDemo: false,
  };
  store.addEntry(entry);
}

function updateRecord(store: ReturnType<typeof useStore>, draft: Draft) {
  const { state } = store;
  const id = draft.sourceId;
  if (!draft.source || !id) return;
  const title = draft.title.trim();
  if (draft.source === 'task') {
    const task = state.tasks.find((row) => row.id === id);
    if (!task) return;
    store.updateTask({ ...task, title, deadline: draft.date || null, notes: draft.notes });
  } else if (draft.source === 'event') {
    const event = state.events.find((row) => row.id === id);
    if (!event) return;
    store.updateEvent({ ...event, name: title, date: draft.date || null, startTime: draft.startTime, endTime: draft.endTime, notes: draft.notes });
  } else if (draft.source === 'trip') {
    const trip = state.trips.find((row) => row.id === id);
    if (!trip) return;
    store.updateTrip({ ...trip, name: title, date: draft.date || null, departureTime: draft.startTime, notes: draft.notes });
  } else if (draft.source === 'entry') {
    const entry = state.entries.find((row) => row.id === id);
    if (!entry || !draft.date) return;
    store.updateEntry({ ...entry, title, date: draft.date, startTime: draft.startTime, endTime: draft.endTime, notes: draft.notes });
  } else if (draft.source === 'expense') {
    const expense = state.expenses.find((row) => row.id === id);
    if (!expense) return;
    store.updateExpense({ ...expense, description: title, paymentDate: draft.date || null, notes: draft.notes || expense.notes });
  } else if (draft.source === 'purchase') {
    const purchase = state.purchases.find((row) => row.id === id);
    if (!purchase) return;
    store.updatePurchase({ ...purchase, name: title, deadline: draft.date || null });
  } else if (draft.source === 'media') {
    const media = state.media.find((row) => row.id === id);
    if (!media) return;
    store.updateMedia({ ...media, name: title, deadline: draft.date || null });
  } else if (draft.source === 'clothing-fitting' || draft.source === 'clothing-delivery') {
    const item = state.clothing.find((row) => row.id === id);
    if (!item) return;
    store.updateClothing({
      ...item,
      fittingDate: draft.source === 'clothing-fitting' ? draft.date || null : item.fittingDate,
      deliveryDeadline: draft.source === 'clothing-delivery' ? draft.date || null : item.deliveryDeadline,
    });
  }
}

function buildMonth(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = first.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<string | null> = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= days; day++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function startOfWeek(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(iso, -weekdayIndex);
}

function shift(iso: string, view: View, direction: number) {
  if (view === 'month') {
    const [year, month, day] = iso.split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    const safeDay = Math.min(day, last);
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  }
  if (view === 'week') return addDays(iso, direction * 7);
  return addDays(iso, direction);
}
