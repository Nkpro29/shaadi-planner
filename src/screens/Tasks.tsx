import { useMemo, useState } from 'react';
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { Badge, DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, toneFor, useConfirm, submitForm } from '../components/ui';
import { eventName, matchesQuery, memberName, sortTasks } from '../selectors';
import { useStore } from '../store';
import type { Priority, Task, TaskStatus } from '../types';
import { amountToInput, daysBetween, formatDate, inr, parseAmount, todayISO, uid } from '../utils';

const blank = (eventId?: string | null): Task => ({
  id: uid(),
  title: '',
  description: '',
  category: 'Wedding preparations',
  assigneeId: null,
  priority: 'Medium',
  status: 'Not Started',
  deadline: null,
  estimatedCost: null,
  notes: '',
  eventId: eventId ?? null,
  isDemo: false,
});

export function TasksPage() {
  const { state, addTask, updateTask, deleteTask } = useStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [assignee, setAssignee] = useState('All');
  const [deadline, setDeadline] = useState('All');
  const [draft, setDraft] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  useOpenIntent({
    onCreate: (extra) => {
      setError(null);
      setDraft(blank(extra.eventId));
    },
    onEdit: (id) => {
      const task = state.tasks.find((row) => row.id === id);
      if (task) {
        setError(null);
        setDraft(task);
      }
    },
  });

  const rows = useMemo(() => {
    const today = todayISO();
    return sortTasks(
      state.tasks.filter((task) => {
        if (!matchesQuery(query, [task.title, task.description, task.notes, task.category, memberName(state, task.assigneeId)])) return false;
        if (category !== 'All' && task.category !== category) return false;
        if (status !== 'All' && task.status !== status) return false;
        if (priority !== 'All' && task.priority !== priority) return false;
        if (assignee !== 'All' && task.assigneeId !== assignee) return false;
        if (deadline === 'Overdue' && !(task.deadline && task.deadline < today && task.status !== 'Completed')) return false;
        if (deadline === 'Today' && task.deadline !== today) return false;
        if (deadline === 'Next 7 days' && !(task.deadline && daysBetween(today, task.deadline) >= 0 && daysBetween(today, task.deadline) <= 7)) return false;
        if (deadline === 'Next 30 days' && !(task.deadline && daysBetween(today, task.deadline) >= 0 && daysBetween(today, task.deadline) <= 30)) return false;
        if (deadline === 'No deadline' && task.deadline) return false;
        return true;
      }),
    );
  }, [assignee, category, deadline, priority, query, state, status]);

  async function remove(task: Task) {
    const ok = await confirm({
      title: 'Delete this task?',
      message: `“${task.title}” will be removed from this device.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteTask(task.id);
  }

  return (
    <div className="page">
      <PageHeader
        title="Tasks & Checklist"
        lede="One list for the whole family. Filter it, assign it, and mark work as it moves."
        actions={<button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blank()); }}>Add task</button>}
      />
      <div className="filters">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks" />
        <Filter label="Category" value={category} onChange={setCategory} options={['All', ...TASK_CATEGORIES]} />
        <Filter label="Status" value={status} onChange={setStatus} options={['All', ...TASK_STATUSES]} />
        <Filter label="Priority" value={priority} onChange={setPriority} options={['All', ...PRIORITIES]} />
        <Filter label="Assignee" value={assignee} onChange={setAssignee} options={['All', ...state.members.map((m) => m.id)]} labels={Object.fromEntries(state.members.map((m) => [m.id, m.name]))} />
        <Filter label="Deadline" value={deadline} onChange={setDeadline} options={['All', 'Overdue', 'Today', 'Next 7 days', 'Next 30 days', 'No deadline']} />
      </div>
      {rows.length === 0 ? (
        <Empty title="No tasks match" text="Add a task, or clear the filters to see the full checklist." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Task</th>
                <th>Category</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Estimate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((task) => (
                <tr key={task.id}>
                  <td data-label="Task">
                    <strong>{task.title}</strong> <DemoBadge show={task.isDemo} />
                    {task.description && <div className="hint">{task.description}</div>}
                    {task.eventId && <div className="hint">Event: {eventName(state, task.eventId)}</div>}
                  </td>
                  <td data-label="Category">{task.category}</td>
                  <td data-label="Assignee">{memberName(state, task.assigneeId)}</td>
                  <td data-label="Priority"><Badge tone={toneFor(task.priority)}>{task.priority}</Badge></td>
                  <td data-label="Status">
                    <select
                      aria-label={`Status for ${task.title}`}
                      value={task.status}
                      onChange={(e) => updateTask({ ...task, status: e.target.value as TaskStatus })}
                    >
                      {TASK_STATUSES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </td>
                  <td data-label="Deadline">{formatDate(task.deadline)}</td>
                  <td data-label="Estimate">{inr(task.estimatedCost)}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(task); }}>Edit</button>
                      <button className="btn btn-small" type="button" onClick={() => remove(task)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {draft && (
        <TaskForm
          draft={draft}
          error={error}
          members={state.members}
          events={state.events}
          onClose={() => setDraft(null)}
          onChange={setDraft}
          onSubmit={() => {
            if (!draft.title.trim()) {
              setError('Please enter a task title.');
              return;
            }
            const saved = { ...draft, title: draft.title.trim() };
            if (state.tasks.some((task) => task.id === saved.id)) updateTask(saved);
            else addTask(saved);
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}

function Filter({
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
        {options.map((option) => (
          <option key={option} value={option}>{labels?.[option] ?? option}</option>
        ))}
      </SelectInput>
    </Field>
  );
}

function TaskForm({
  draft,
  error,
  members,
  events,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: Task;
  error: string | null;
  members: { id: string; name: string }[];
  events: { id: string; name: string }[];
  onClose: () => void;
  onChange: (task: Task) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<Task>) => onChange({ ...draft, ...patch });
  return (
    <Modal title={draft.title ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={(event) => { submitForm(event); onSubmit(); }}>
        <div className="modal-body form-grid">
          <FormError message={error} />
          <Field label="Title">
            <TextInput value={draft.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Category">
            <SelectInput value={draft.category} onChange={(e) => set({ category: e.target.value })}>
              {TASK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </Field>
          <div className="wide">
            <Field label="Description">
              <TextArea value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </div>
          <Field label="Assigned to">
            <SelectInput value={draft.assigneeId ?? ''} onChange={(e) => set({ assigneeId: e.target.value || null })}>
              <option value="">Unassigned</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Related event">
            <SelectInput value={draft.eventId ?? ''} onChange={(e) => set({ eventId: e.target.value || null })}>
              <option value="">None</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput value={draft.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
              {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={draft.status} onChange={(e) => set({ status: e.target.value as TaskStatus })}>
              {TASK_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </Field>
          <Field label="Deadline">
            <TextInput type="date" value={draft.deadline ?? ''} onChange={(e) => set({ deadline: e.target.value || null })} />
          </Field>
          <Field label="Estimated cost (INR)">
            <TextInput
              inputMode="decimal"
              value={amountToInput(draft.estimatedCost)}
              onChange={(e) => set({ estimatedCost: parseAmount(e.target.value) })}
            />
          </Field>
          <div className="wide">
            <Field label="Notes">
              <TextArea value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit">Save task</button>
        </div>
      </form>
    </Modal>
  );
}
