"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaField,
  CategoryField,
  DateField,
  EventField,
  FilterSelect,
  FormGrid,
  MoneyField,
  OptionField,
  PersonField,
  TextField,
} from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, statusTone, useConfirm } from "@/components/ui";
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES, labelOf } from "@/lib/constants";
import { eventName, matchesDeadline, personName, searchMatch } from "@/lib/calc";
import { deadlineLabel, formatINR, moneyOrBlank, parseMoney, todayISO, uid } from "@/lib/format";
import { deleteTask, saveTask, setTaskStatus } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { Person, Priority, Task, TaskStatus, WeddingEvent } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

export function TasksPage() {
  const planner = useReadyPlanner();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [deadline, setDeadline] = useState("any");
  const { ask, dialog } = useConfirm();
  const ready = Boolean(planner);
  const openEdit = useCallback(
    (id: string) => {
      const task = planner?.state.tasks.find((item) => item.id === id);
      if (task) setEditing(task);
    },
    [planner?.state.tasks],
  );
  const openNew = useCallback((value: string) => {
    if (value === "1") setCreating(true);
  }, []);
  useOpenFromQuery("edit", openEdit, ready);
  useOpenFromQuery("new", openNew, ready);
  const params = useSearchParams();
  const presetEvent = params.get("event") ?? "";

  const today = todayISO();
  const tasks = useMemo(() => {
    if (!planner) return [];
    return planner.state.tasks
      .filter((task) => (category === "all" ? true : task.category === category))
      .filter((task) => (status === "all" ? true : task.status === status))
      .filter((task) => (priority === "all" ? true : task.priority === priority))
      .filter((task) => (assignee === "all" ? true : assignee === "none" ? !task.assigneeId : task.assigneeId === assignee))
      .filter((task) => matchesDeadline(task.deadline, deadline, today))
      .filter((task) => searchMatch(query, [task.title, task.description, task.notes, task.category]))
      .sort((a, b) => compareTasks(a, b, today));
  }, [assignee, category, deadline, planner, priority, query, status, today]);

  if (!planner) return null;
  const { state, update } = planner;

  return (
    <div>
      <PageHeader
        eyebrow="Checklist"
        title="Tasks"
        subtitle="Every preparation in one list. Filter it, assign it, and mark it done when it is finished."
        action={<Button onClick={() => setCreating(true)}>Add a task</Button>}
      />
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block md:col-span-2 xl:col-span-3">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Search</span>
            <input className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base" value={query} placeholder="Search tasks" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <FilterSelect label="Category" value={category} onChange={setCategory}>
            <option value="all">All categories</option>
            {TASK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Priority" value={priority} onChange={setPriority}>
            <option value="all">All priorities</option>
            {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Assigned to" value={assignee} onChange={setAssignee}>
            <option value="all">Anyone</option>
            <option value="none">Unassigned</option>
            {state.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Deadline" value={deadline} onChange={setDeadline}>
            <option value="any">Any date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="week">Next 7 days</option>
            <option value="later">Later</option>
            <option value="none">No date</option>
          </FilterSelect>
        </div>
        <p className="mt-3 text-sm text-muted">Showing {tasks.length} of {state.tasks.length} tasks.</p>
      </Card>
      {tasks.length ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = Boolean(task.deadline && task.deadline < today && task.status !== "completed");
            return (
              <Card key={task.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{task.title}</h2>
                      <SampleTag show={task.isSample} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{task.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(task.priority)}>{labelOf(PRIORITIES, task.priority)}</Badge>
                    <Badge tone={statusTone(task.status)}>{labelOf(TASK_STATUSES, task.status)}</Badge>
                  </div>
                </div>
                {task.description ? <p className="mt-3 text-sm leading-6">{task.description}</p> : null}
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Assigned to</dt><dd>{personName(state, task.assigneeId) || "Unassigned"}</dd></div>
                  <div><dt className="text-muted">Deadline</dt><dd className={overdue ? "font-semibold text-danger" : ""}>{deadlineLabel(task.deadline, today)}</dd></div>
                  <div><dt className="text-muted">Estimated cost</dt><dd>{formatINR(task.estimatedCost)}</dd></div>
                  <div><dt className="text-muted">Related event</dt><dd>{eventName(state, task.eventId) || "—"}</dd></div>
                </dl>
                {task.notes ? <p className="mt-3 text-sm text-muted">{task.notes}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="min-w-40 flex-1">
                    <span className="sr-only">Status for {task.title}</span>
                    <select
                      className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
                      value={task.status}
                      onChange={(event) => update((current) => setTaskStatus(current, task.id, event.target.value as TaskStatus))}
                    >
                      {TASK_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  {task.status !== "completed" ? (
                    <Button variant="secondary" onClick={() => update((current) => setTaskStatus(current, task.id, "completed"))}>Mark complete</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => update((current) => setTaskStatus(current, task.id, "not_started"))}>Reopen</Button>
                  )}
                  <Button variant="secondary" onClick={() => setEditing(task)}>Edit</Button>
                  <Button
                    variant="danger"
                    onClick={() => ask(`Delete “${task.title}”?`, "This removes the task. It cannot be undone.", () => update((current) => deleteTask(current, task.id)))}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No tasks match" body="Change the filters, or add a task for something the family still needs to do." action={<Button onClick={() => setCreating(true)}>Add a task</Button>} />
      )}
      {creating ? (
        <TaskForm
          presetEvent={presetEvent}
          people={state.people}
          events={state.events}
          onClose={() => setCreating(false)}
          onSave={(task) => update((current) => saveTask(current, task))}
        />
      ) : null}
      {editing ? (
        <TaskForm
          key={editing.id}
          initial={editing}
          people={state.people}
          events={state.events}
          onClose={() => setEditing(null)}
          onSave={(task) => update((current) => saveTask(current, task))}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function compareTasks(a: Task, b: Task, today: string) {
  const done = Number(a.status === "completed") - Number(b.status === "completed");
  if (done) return done;
  const aOver = a.deadline && a.deadline < today ? 0 : 1;
  const bOver = b.deadline && b.deadline < today ? 0 : 1;
  if (aOver !== bOver) return aOver - bOver;
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}

function TaskForm({
  initial,
  people,
  events,
  presetEvent = "",
  onClose,
  onSave,
}: {
  initial?: Task;
  people: Person[];
  events: WeddingEvent[];
  presetEvent?: string;
  onClose: () => void;
  onSave: (task: Task) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Wedding preparations");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "not_started");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedCost));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [eventId, setEventId] = useState(initial?.eventId ?? presetEvent);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    if (!category) {
      setError("Choose a category.");
      return;
    }
    const cost = parseMoney(estimated);
    if (!cost.ok) {
      setError("Enter the estimated cost as a number, or leave it blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      title: title.trim(),
      description: description.trim(),
      category,
      assigneeId,
      priority,
      status,
      deadline,
      estimatedCost: cost.value,
      notes: notes.trim(),
      eventId,
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit task" : "Add a task"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Title" required value={title} onChange={setTitle} />
        <AreaField label="Description" value={description} onChange={setDescription} />
        <FormGrid>
          <CategoryField label="Category" value={category} onChange={setCategory} options={TASK_CATEGORIES} />
          <PersonField label="Assigned family member" people={people} value={assigneeId} onChange={setAssigneeId} />
          <OptionField label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          <OptionField label="Status" value={status} onChange={setStatus} options={TASK_STATUSES} />
          <DateField label="Deadline" value={deadline} onChange={setDeadline} />
          <MoneyField label="Estimated cost" value={estimated} onChange={setEstimated} />
          <EventField label="Related event" events={events} value={eventId} onChange={setEventId} />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
