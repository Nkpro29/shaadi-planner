"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AreaField, CategoryField, DateField, EventField, FormGrid, MoneyField, TextField } from "@/components/fields";
import { Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, SampleTag, Stat, useConfirm } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { budgetSummary, categoryTotals, eventName, expenseOutstanding } from "@/lib/calc";
import { formatIN, formatINR, moneyOrBlank, parseMoney, uid } from "@/lib/format";
import { deleteExpense, saveExpense } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { Expense, WeddingEvent } from "@/lib/types";
import { useOpenFromQuery } from "@/lib/use-open-query";

export function BudgetPage() {
  const planner = useReadyPlanner();
  const params = useSearchParams();
  const presetEvent = params.get("event") ?? "";
  const [mode, setMode] = useState<"estimated" | "actual" | "paid">("estimated");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const { ask, dialog } = useConfirm();
  const ready = Boolean(planner);
  useOpenFromQuery("new", useCallback((value: string) => {
    if (value === "1") setCreating(true);
  }, []), ready);
  useOpenFromQuery("edit", useCallback((id: string) => {
    const expense = planner?.state.expenses.find((item) => item.id === id);
    if (expense) setEditing(expense);
  }, [planner?.state.expenses]), ready);

  if (!planner) return null;
  const { state, update } = planner;
  const summary = budgetSummary(state);
  const bars = categoryTotals(state.expenses, mode);
  const max = Math.max(...bars.map(([, amount]) => amount), 1);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Money"
        title="Budget & expenses"
        subtitle="This is the only place spending is added into the wedding totals. Shopping prices and gift prices stay in their own lists until you record a payment here."
        action={<Button onClick={() => setCreating(true)}>Add an expense</Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Wedding budget" value={formatINR(summary.budget)} hint={summary.budget == null ? "Set this on the dashboard" : "The total you entered"} />
        <Stat label="Estimated expenditure" value={formatINR(summary.estimated)} />
        <Stat label="Actual expenditure" value={formatINR(summary.actual)} hint={summary.actual == null ? "No actual amounts yet" : undefined} />
        <Stat label="Total paid" value={formatINR(summary.paid)} hint={summary.paid == null ? "No payments entered" : undefined} />
        <Stat label="Outstanding" value={formatINR(summary.outstanding)} hint="Actual cost minus amount paid, where a bill or payment exists" />
        <Stat label="Remaining budget" value={formatINR(summary.remaining)} hint={summary.budget == null ? "Set a budget first" : "Budget minus actual spending"} />
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-maroon-deep">Spending by category</h2>
          <div className="flex gap-2">
            {(["estimated", "actual", "paid"] as const).map((item) => (
              <button key={item} type="button" className={`min-h-11 rounded-xl px-3 text-sm font-semibold capitalize ${mode === item ? "bg-maroon text-ivory" : "border border-line bg-white"}`} onClick={() => setMode(item)}>{item}</button>
            ))}
          </div>
        </div>
        {bars.length ? (
          <div className="mt-4 space-y-3">
            {bars.map(([category, amount]) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{category}</span>
                  <span className="font-semibold">{formatINR(amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-line">
                  <div className="h-2 rounded-full bg-maroon" style={{ width: `${Math.max(4, (amount / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No {mode} amounts yet. Add a number on an expense to see it here.</p>
        )}
      </Card>
      {state.expenses.length ? (
        <div className="space-y-3">
          {state.expenses.map((expense) => {
            const due = expenseOutstanding(expense);
            return (
              <Card key={expense.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{expense.description}</h2>
                      <SampleTag show={expense.isSample} />
                    </div>
                    <p className="text-sm text-muted">{expense.category}{expense.vendor ? ` · ${expense.vendor}` : ""}</p>
                  </div>
                  <p className="text-sm font-semibold">{due == null ? "No bill yet" : `${formatINR(due)} still to pay`}</p>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="text-muted">Estimated</dt><dd>{formatINR(expense.estimatedCost)}</dd></div>
                  <div><dt className="text-muted">Actual</dt><dd>{formatINR(expense.actualCost)}</dd></div>
                  <div><dt className="text-muted">Paid</dt><dd>{formatINR(expense.amountPaid)}</dd></div>
                  <div><dt className="text-muted">Event</dt><dd>{eventName(state, expense.eventId) || "—"}</dd></div>
                  <div><dt className="text-muted">Payment date</dt><dd>{formatIN(expense.paymentDate)}</dd></div>
                </dl>
                {expense.notes ? <p className="mt-2 text-sm text-muted">{expense.notes}</p> : null}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(expense)}>Edit</Button>
                  <Button variant="danger" onClick={() => ask(`Delete “${expense.description}”?`, "This removes the expense from the budget. Shopping items are not changed.", () => update((current) => deleteExpense(current, expense.id)))}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No expenses yet" body="Add a vendor bill or a payment when you know the amount." action={<Button onClick={() => setCreating(true)}>Add an expense</Button>} />
      )}
      {creating ? <ExpenseForm events={state.events} presetEvent={presetEvent} onClose={() => setCreating(false)} onSave={(expense) => update((current) => saveExpense(current, expense))} /> : null}
      {editing ? <ExpenseForm key={editing.id} initial={editing} events={state.events} onClose={() => setEditing(null)} onSave={(expense) => update((current) => saveExpense(current, expense))} /> : null}
      {dialog}
    </div>
  );
}

function ExpenseForm({
  initial,
  events,
  presetEvent = "",
  onClose,
  onSave,
}: {
  initial?: Expense;
  events: WeddingEvent[];
  presetEvent?: string;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [eventId, setEventId] = useState(initial?.eventId ?? presetEvent);
  const [estimated, setEstimated] = useState(moneyOrBlank(initial?.estimatedCost));
  const [actual, setActual] = useState(moneyOrBlank(initial?.actualCost));
  const [paid, setPaid] = useState(moneyOrBlank(initial?.amountPaid));
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [paymentDate, setPaymentDate] = useState(initial?.paymentDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim() || !category) {
      setError("Add a description and a category.");
      return;
    }
    const estimatedCost = parseMoney(estimated);
    const actualCost = parseMoney(actual);
    const amountPaid = parseMoney(paid);
    if (!estimatedCost.ok || !actualCost.ok || !amountPaid.ok) {
      setError("Amounts must be numbers, or left blank.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      description: description.trim(),
      category,
      eventId,
      estimatedCost: estimatedCost.value,
      actualCost: actualCost.value,
      amountPaid: amountPaid.value,
      vendor: vendor.trim(),
      paymentDate,
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  }

  return (
    <Modal title={initial ? "Edit expense" : "Add an expense"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-muted">Leave actual cost blank until there is a bill. Amount still to pay is calculated for you. Do not also add the same purchase price from the shopping list.</p>
        <TextField label="Description" required value={description} onChange={setDescription} />
        <FormGrid>
          <CategoryField label="Category" value={category} onChange={setCategory} options={EXPENSE_CATEGORIES} />
          <EventField label="Related event" events={events} value={eventId} onChange={setEventId} />
          <MoneyField label="Estimated cost" value={estimated} onChange={setEstimated} />
          <MoneyField label="Actual cost" value={actual} onChange={setActual} />
          <MoneyField label="Amount paid" value={paid} onChange={setPaid} />
          <TextField label="Vendor" value={vendor} onChange={setVendor} />
          <DateField label="Payment date" value={paymentDate} onChange={setPaymentDate} />
        </FormGrid>
        <AreaField label="Notes" value={notes} onChange={setNotes} />
        <FormError message={error} />
        <FormActions onClose={onClose} />
      </form>
    </Modal>
  );
}
