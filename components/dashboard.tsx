"use client";

import { useState } from "react";
import { AgendaList } from "@/components/agenda-list";
import { SettingsForm } from "@/components/settings-form";
import { ActionLink, Badge, Card, Modal, PageHeader, SampleTag, Stat } from "@/components/ui";
import {
  budgetSummary,
  collectAgenda,
  pendingClothing,
  pendingGifts,
  pendingPurchases,
  taskProgress,
} from "@/lib/calc";
import { daysUntil, formatIN, formatINR, todayISO } from "@/lib/format";
import { saveSettings } from "@/lib/mutate";
import { hasSample } from "@/lib/sample";
import { useReadyPlanner } from "@/lib/store";

export function Dashboard() {
  const planner = useReadyPlanner();
  const [editing, setEditing] = useState(false);
  if (!planner) return null;
  const { state, update } = planner;
  const today = todayISO();
  const days = daysUntil(state.settings.weddingDate, today);
  const progress = taskProgress(state);
  const budget = budgetSummary(state);
  const agenda = collectAgenda(state);
  const purchases = pendingPurchases(state);
  const gifts = pendingGifts(state);
  const clothing = pendingClothing(state);
  const upcoming = state.events
    .filter((event) => event.date && event.date >= today && event.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  const undated = state.events.filter((event) => !event.date && event.status !== "cancelled");
  const overdue = state.tasks.filter((task) => task.deadline && task.deadline < today && task.status !== "completed");
  const todayItems = agenda.filter((item) => item.date === today);
  const needsDetails = !state.settings.weddingDate || state.settings.totalBudget == null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="ShaadiSaathi"
        title={`${state.settings.brideName} & ${state.settings.groomName}`}
        subtitle="One place for ceremonies, shopping, clothes, Bhaat, guests, and spending. Totals come from what you enter."
        action={<ActionLink href="/calendar">Open calendar</ActionLink>}
      />

      {hasSample(state) ? (
        <Card className="border-gold-soft bg-[#fbf6ea]">
          <p className="text-sm leading-6">
            <SampleTag show /> Records marked Sample are examples. None of them are completed, and no prices have been filled in. The wedding date and budget stay empty until you enter them. Remove sample data from the menu when you are ready.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">The wedding</p>
          <h2 className="mt-2 font-display text-4xl text-maroon-deep">
            {state.settings.weddingDate ? formatIN(state.settings.weddingDate) : "Date not set"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {days == null
              ? "Add the date when it is fixed. Days remaining will appear here."
              : days === 0
                ? "Today is the wedding day."
                : days > 0
                  ? `${days} day${days === 1 ? "" : "s"} remaining.`
                  : `The wedding date was ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Bride</dt>
              <dd className="font-semibold">{state.settings.brideName}</dd>
            </div>
            <div>
              <dt className="text-muted">Groom</dt>
              <dd className="font-semibold">{state.settings.groomName}</dd>
            </div>
          </dl>
          <button type="button" className="mt-4 text-sm font-semibold text-maroon underline" onClick={() => setEditing(true)}>
            Edit wedding details
          </button>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Tasks</p>
            <p className="mt-2 text-5xl font-semibold tabular-nums text-maroon-deep">{progress.percent}%</p>
            <p className="mt-1 text-sm text-muted">
              {progress.done} of {progress.total} completed
            </p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-gold-soft">
            <div className="h-2 rounded-full bg-maroon" style={{ width: `${progress.percent}%` }} />
          </div>
        </Card>
      </div>

      {needsDetails ? (
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Add the date and budget when you know them</h2>
          <p className="mb-4 mt-2 text-sm leading-6 text-muted">
            ShaadiSaathi will not guess these. Remaining budget is your budget minus actual spending entered in Budget & Expenses.
          </p>
          <SettingsForm
            settings={state.settings}
            onSave={(settings) => update((current) => saveSettings(current, settings))}
          />
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Wedding budget" value={formatINR(budget.budget)} hint={budget.budget == null ? "Not set" : "The total you entered"} />
        <Stat label="Estimated expenses" value={formatINR(budget.estimated)} hint="From the expense list" />
        <Stat
          label="Actual spending"
          value={formatINR(budget.actual)}
          hint={budget.actual == null ? "No actual amounts entered yet" : "Sum of actual costs"}
        />
        <Stat
          label="Remaining budget"
          value={formatINR(budget.remaining)}
          hint={budget.budget == null ? "Set a budget first" : budget.actual == null ? "No spending entered, so the full budget remains" : "Budget minus actual spending"}
        />
        <Stat label="Pending purchases" value={String(purchases.length)} hint="To buy or shortlisted" />
        <Stat label="Pending gifts" value={String(gifts.length)} hint="Not ready or given" />
        <Stat label="Clothing still to buy" value={String(clothing.length)} hint="Outfits marked to buy or shortlisted" />
        <Stat label="Overdue tasks" value={String(overdue.length)} hint="Deadlines before today" />
      </div>
      <p className="text-xs leading-5 text-muted">
        A linked outfit can appear in both clothing and shopping. Money is counted on the dashboard only from Budget & Expenses, so a purchase is not added twice.
      </p>

      <Card>
        <h2 className="font-display text-3xl text-maroon-deep">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionLink href="/tasks?new=1" variant="primary">Add a task</ActionLink>
          <ActionLink href="/shopping?new=1">Add a purchase</ActionLink>
          <ActionLink href="/couple">Bride & groom shopping</ActionLink>
          <ActionLink href="/events?new=1">Add an event</ActionLink>
          <ActionLink href="/gifts?new=1">Add a gift</ActionLink>
          <ActionLink href="/family?new=1">Add a family member</ActionLink>
          <ActionLink href="/budget?new=1">Add an expense</ActionLink>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Today&apos;s schedule</h2>
          <div className="mt-2">
            <AgendaList items={todayItems} empty="Nothing is scheduled for today. Add a date to an event, task, trip, or calendar entry." />
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Overdue tasks</h2>
          {overdue.length ? (
            <ul className="mt-2 divide-y divide-line">
              {overdue.map((task) => (
                <li key={task.id} className="py-3">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-danger">Due {formatIN(task.deadline)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No overdue tasks.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Upcoming events</h2>
          {upcoming.length ? (
            <ul className="mt-2 divide-y divide-line">
              {upcoming.slice(0, 5).map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{event.name}</p>
                    <p className="text-sm text-muted">{formatIN(event.date)}{event.venue ? ` · ${event.venue}` : ""}</p>
                  </div>
                  <Badge tone="maroon">{event.status === "planning" ? "Planning" : event.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No dated events yet.</p>
          )}
          {undated.length ? (
            <p className="mt-3 text-sm text-muted">{undated.length} event{undated.length === 1 ? "" : "s"} still need a date.</p>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-display text-3xl text-maroon-deep">Still to sort</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            <li>{purchases.length} purchases are not bought yet.</li>
            <li>{gifts.length} gifts are not ready.</li>
            <li>{clothing.length} clothing items are still to buy.</li>
            <li>{state.trips.filter((trip) => !trip.date).length} shopping trip{state.trips.filter((trip) => !trip.date).length === 1 ? "" : "s"} have no date.</li>
          </ul>
        </Card>
      </div>

      {editing ? (
        <Modal title="Wedding details" onClose={() => setEditing(false)}>
          <SettingsForm
            settings={state.settings}
            onSave={(settings) => {
              update((current) => saveSettings(current, settings));
              setEditing(false);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
