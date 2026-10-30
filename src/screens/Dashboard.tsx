import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  agendaOn,
  budgetSummary,
  overdueTasks,
  pendingClothing,
  pendingGifts,
  pendingPurchases,
  taskProgress,
  upcomingEvents,
  undatedEvents,
} from '../selectors';
import { daysBetween, downloadText, formatDate, formatDateLong, inr, parseAmount, todayISO } from '../utils';
import { Field, FormError, Modal, TextInput, submitForm } from '../components/ui';
import type { AppState } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const { state, updateProfile, restoreSample, eraseAll, replaceAll, saveError } = useStore();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const today = todayISO();
  const progress = taskProgress(state);
  const budget = budgetSummary(state);
  const overdue = overdueTasks(state);
  const upcoming = upcomingEvents(state);
  const undated = undatedEvents(state);
  const todayItems = agendaOn(state, today);
  const days = state.profile.weddingDate ? daysBetween(today, state.profile.weddingDate) : null;
  const sampleCount = countDemo(state);

  function exportBackup() {
    downloadText(
      'shaadisaathi-backup.json',
      JSON.stringify(state, null, 2),
      'application/json',
    );
  }

  async function importBackup(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      const error = replaceAll(parsed);
      setMessage(error ?? 'Backup restored on this device.');
    } catch {
      setMessage('That file could not be read. Choose a ShaadiSaathi JSON backup.');
    }
  }

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Wedding of</p>
          <h1>
            {state.profile.brideName} <span>&</span> {state.profile.groomName}
          </h1>
          <p className="lede">
            {state.profile.weddingDate
              ? formatDateLong(state.profile.weddingDate)
              : 'The wedding date is not set. Add it when the family confirms the day.'}
          </p>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="button" onClick={() => setEditing(true)}>
              Edit wedding details
            </button>
          </div>
        </div>
        <div className="countdown">
          {days == null && (
            <>
              <strong>—</strong>
              <span>Set a date for the countdown</span>
            </>
          )}
          {days != null && days > 0 && (
            <>
              <strong>{days}</strong>
              <span>{days === 1 ? 'day to go' : 'days to go'}</span>
            </>
          )}
          {days === 0 && (
            <>
              <strong>Today</strong>
              <span>is the wedding day</span>
            </>
          )}
          {days != null && days < 0 && (
            <>
              <strong>{Math.abs(days)}</strong>
              <span>days since the wedding</span>
            </>
          )}
        </div>
      </section>

      {sampleCount > 0 && (
        <div className="notice">
          {sampleCount} sample records are loaded so the family can see how the planner works. They are marked Sample.
          Nothing is marked completed, and prices are blank until you enter them.
        </div>
      )}

      <section className="stat-grid">
        <article className="stat">
          <div className="stat-label">Tasks completed</div>
          <div className="stat-value">{progress.percent}%</div>
          <div className="bar" aria-hidden="true"><span style={{ width: `${progress.percent}%` }} /></div>
          <p className="hint">{progress.done} of {progress.total} tasks</p>
        </article>
        <article className="stat">
          <div className="stat-label">Overall budget</div>
          <div className="stat-value">{budget.overall == null ? 'Not set' : inr(budget.overall)}</div>
          <p className="hint">Entered by the family. Not a guess.</p>
        </article>
        <article className="stat">
          <div className="stat-label">Actual spending</div>
          <div className="stat-value">{inr(budget.recordedActual)}</div>
          <p className="hint">From the expense book only</p>
        </article>
        <article className="stat">
          <div className="stat-label">Remaining budget</div>
          <div className="stat-value">{budget.remaining == null ? '—' : inr(budget.remaining)}</div>
          <p className="hint">{budget.overall == null ? 'Set a budget to see what is left' : 'Overall budget minus actual spending'}</p>
        </article>
        <article className="stat">
          <div className="stat-label">Pending purchases</div>
          <div className="stat-value">{pendingPurchases(state).length}</div>
        </article>
        <article className="stat">
          <div className="stat-label">Pending gifts</div>
          <div className="stat-value">{pendingGifts(state).length}</div>
        </article>
        <article className="stat">
          <div className="stat-label">Pending clothing</div>
          <div className="stat-value">{pendingClothing(state).length}</div>
        </article>
        <article className="stat">
          <div className="stat-label">Overdue tasks</div>
          <div className="stat-value">{overdue.length}</div>
        </article>
      </section>

      <section className="card">
        <h2>Quick actions</h2>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" type="button" onClick={() => navigate('/tasks', { state: { compose: true } })}>Add task</button>
          <button className="btn" type="button" onClick={() => navigate('/shopping', { state: { compose: true } })}>Add purchase</button>
          <button className="btn" type="button" onClick={() => navigate('/events', { state: { compose: true } })}>Add event</button>
          <button className="btn" type="button" onClick={() => navigate('/gifts', { state: { compose: true } })}>Add gift</button>
          <button className="btn" type="button" onClick={() => navigate('/family', { state: { compose: true } })}>Add family member</button>
          <button className="btn" type="button" onClick={() => navigate('/budget', { state: { compose: true } })}>Add expense</button>
        </div>
      </section>

      <section className="dash-grid">
        <article className="card">
          <h2>Today’s schedule</h2>
          <p className="hint">{formatDateLong(today)} · Asia/Kolkata</p>
          <div className="list">
            {todayItems.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Nothing is scheduled today.</p>}
            {todayItems.map((item) => (
              <div className="list-row" key={item.key}>
                <div>
                  <strong>{item.title}</strong>
                  <div className="hint">{item.kindLabel}{item.startTime ? ` · ${item.startTime}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Upcoming events</h2>
          <div className="list">
            {upcoming.length === 0 && <p className="muted" style={{ marginTop: 12 }}>No dated events yet.</p>}
            {upcoming.map((event) => (
              <button
                key={event.id}
                className="list-row linkish"
                type="button"
                onClick={() => navigate('/events', { state: { editId: event.id } })}
              >
                <span>
                  <strong>{event.name}</strong>
                  <span className="hint">{formatDate(event.date)}{event.startTime ? ` · ${event.startTime}` : ''}</span>
                </span>
              </button>
            ))}
          </div>
          {undated.length > 0 && <p className="hint">{undated.length} events still need a date.</p>}
        </article>
      </section>

      <article className="card">
        <h2>Overdue tasks</h2>
        <div className="list">
          {overdue.length === 0 && <p className="muted" style={{ marginTop: 12 }}>No overdue tasks.</p>}
          {overdue.map((task) => (
            <button
              key={task.id}
              className="list-row linkish"
              type="button"
              onClick={() => navigate('/tasks', { state: { editId: task.id } })}
            >
              <span>
                <strong>{task.title}</strong>
                <span className="hint">Due {formatDate(task.deadline)} · {task.status}</span>
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className="card">
        <h2>Data on this device</h2>
        <p className="lede">
          Export a backup file before clearing the browser. Import replaces the plan currently saved here.
          {saveError ? ` ${saveError}` : ''}
        </p>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn" type="button" onClick={exportBackup}>Export backup</button>
          <label className="btn">
            Import backup
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importBackup(file);
                e.target.value = '';
              }}
            />
          </label>
          <button
            className="btn"
            type="button"
            onClick={() => {
              restoreSample();
              setMessage('Sample records were added back. Your own records, date, and budget were kept.');
            }}
          >
            Restore sample records
          </button>
          <button
            className="btn btn-danger"
            type="button"
            onClick={() => {
              if (window.confirm('Erase all lists on this device? Names, wedding date, and budget will stay.')) {
                eraseAll();
                setMessage('Lists cleared on this device.');
              }
            }}
          >
            Erase lists
          </button>
        </div>
        {message && <p className="hint">{message}</p>}
      </article>

      {editing && (
        <ProfileModal
          brideName={state.profile.brideName}
          groomName={state.profile.groomName}
          weddingDate={state.profile.weddingDate}
          totalBudget={state.profile.totalBudget}
          onClose={() => setEditing(false)}
          onSave={(profile) => {
            updateProfile(profile);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function countDemo(state: AppState) {
  const rows = [
    ...state.members,
    ...state.tasks,
    ...state.events,
    ...state.purchases,
    ...state.trips,
    ...state.clothing,
    ...state.gifts,
    ...state.guests,
    ...state.expenses,
    ...state.media,
    ...state.entries,
  ];
  return rows.filter((row) => row.isDemo).length;
}

function ProfileModal({
  brideName,
  groomName,
  weddingDate,
  totalBudget,
  onClose,
  onSave,
}: {
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  totalBudget: number | null;
  onClose: () => void;
  onSave: (profile: { brideName: string; groomName: string; weddingDate: string | null; totalBudget: number | null }) => void;
}) {
  const [bride, setBride] = useState(brideName);
  const [groom, setGroom] = useState(groomName);
  const [date, setDate] = useState(weddingDate ?? '');
  const [budget, setBudget] = useState(totalBudget == null ? '' : String(totalBudget));
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="Wedding details" subtitle="Leave the date or budget blank until the family decides." onClose={onClose}>
      <form
        onSubmit={(event) => {
          submitForm(event);
          if (!bride.trim() || !groom.trim()) {
            setError('Please enter the bride and groom’s names.');
            return;
          }
          const amount = parseAmount(budget);
          if (budget.trim() && amount == null) {
            setError('Enter the budget as a number in rupees, or leave it blank.');
            return;
          }
          onSave({
            brideName: bride.trim(),
            groomName: groom.trim(),
            weddingDate: date || null,
            totalBudget: budget.trim() ? amount : null,
          });
        }}
      >
        <div className="modal-body form-grid">
          <FormError message={error} />
          <Field label="Bride’s name">
            <TextInput value={bride} onChange={(e) => setBride(e.target.value)} required />
          </Field>
          <Field label="Groom’s name">
            <TextInput value={groom} onChange={(e) => setGroom(e.target.value)} required />
          </Field>
          <Field label="Wedding date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Overall budget (INR)" hint="This is the total the family wants to spend.">
            <TextInput inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Leave blank if not decided" />
          </Field>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save on this device</button>
        </div>
      </form>
    </Modal>
  );
}
