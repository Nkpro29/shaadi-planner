import { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../constants';
import { useOpenIntent } from '../components/useOpenIntent';
import { DemoBadge, Empty, Field, FormError, Modal, PageHeader, SearchInput, SelectInput, TextArea, TextInput, useConfirm, submitForm } from '../components/ui';
import { budgetSummary, eventName, expenseRemaining, matchesQuery } from '../selectors';
import { useStore } from '../store';
import type { Expense } from '../types';
import { amountToInput, formatDate, inr, parseAmount, uid } from '../utils';

function blankExpense(eventId?: string | null): Expense {
  return {
    id: uid(),
    description: '',
    category: 'Miscellaneous',
    eventId: eventId ?? null,
    estimatedCost: null,
    actualCost: null,
    amountPaid: null,
    vendor: '',
    paymentDate: null,
    notes: '',
    linkedPurchaseId: null,
    linkedClothingId: null,
    linkedGiftId: null,
    isDemo: false,
  };
}

export function BudgetPage() {
  const {
    state,
    addExpense,
    updateExpense,
    deleteExpense,
    recordPurchaseExpense,
    recordClothingExpense,
    recordGiftExpense,
  } = useStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [draft, setDraft] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const summary = budgetSummary(state);
  const max = Math.max(...summary.byCategory.map((row) => row.amount), 1);

  useOpenIntent({
    onCreate: (extra) => {
      setError(null);
      setDraft(blankExpense(extra.eventId));
    },
    onEdit: (id) => {
      const expense = state.expenses.find((item) => item.id === id);
      if (expense) {
        setError(null);
        setDraft(expense);
      }
    },
  });

  const rows = state.expenses.filter((expense) => {
    if (category !== 'All' && expense.category !== category) return false;
    return matchesQuery(query, [expense.description, expense.vendor, expense.notes, expense.category]);
  });

  const linkedPurchases = new Set(state.expenses.map((expense) => expense.linkedPurchaseId).filter(Boolean));
  const linkedClothing = new Set(state.expenses.map((expense) => expense.linkedClothingId).filter(Boolean));
  const linkedGifts = new Set(state.expenses.map((expense) => expense.linkedGiftId).filter(Boolean));
  const unrecorded = [
    ...state.purchases
      .filter((item) => ['Purchased', 'Delivered'].includes(item.status) && !linkedPurchases.has(item.id))
      .map((item) => ({ id: item.id, label: item.name, kind: 'purchase' as const })),
    ...state.clothing
      .filter((item) => ['Purchased', 'Delivered'].includes(item.status) && !linkedClothing.has(item.id))
      .map((item) => ({ id: item.id, label: item.clothingType, kind: 'clothing' as const })),
    ...state.gifts
      .filter((item) => ['Purchased', 'Packaging Pending', 'Ready', 'Given'].includes(item.status) && !linkedGifts.has(item.id))
      .map((item) => ({ id: item.id, label: `${item.description || 'Gift'} · ${item.recipient}`, kind: 'gift' as const })),
  ];

  async function remove(expense: Expense) {
    const ok = await confirm({
      title: 'Delete this expense?',
      message: 'The shopping item or gift it came from will stay. Only this payment row is removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) deleteExpense(expense.id);
  }

  return (
    <div className="page">
      <PageHeader
        title="Budget & Expenses"
        lede="The overall budget is the number you enter. Actual spending counts only what is in this expense book, so a purchase and its payment are not added twice."
        actions={<button className="btn btn-primary" type="button" onClick={() => { setError(null); setDraft(blankExpense()); }}>Add expense</button>}
      />
      <section className="stat-grid">
        <article className="stat"><div className="stat-label">Overall budget</div><div className="stat-value">{summary.overall == null ? 'Not set' : inr(summary.overall)}</div></article>
        <article className="stat"><div className="stat-label">Estimated expenditure</div><div className="stat-value">{inr(summary.totalEstimated)}</div><p className="hint">Expense book plus prices not yet recorded</p></article>
        <article className="stat"><div className="stat-label">Actual expenditure</div><div className="stat-value">{inr(summary.recordedActual)}</div></article>
        <article className="stat"><div className="stat-label">Total paid</div><div className="stat-value">{inr(summary.recordedPaid)}</div></article>
        <article className="stat"><div className="stat-label">Outstanding payments</div><div className="stat-value">{inr(summary.outstanding)}</div></article>
        <article className="stat"><div className="stat-label">Remaining budget</div><div className="stat-value">{summary.remaining == null ? '—' : inr(summary.remaining)}</div></article>
      </section>

      <section className="card">
        <h2>Spending by category</h2>
        {summary.byCategory.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>Enter prices on purchases, gifts, or expenses to see this chart.</p>
        ) : (
          <div className="chart" style={{ marginTop: 12 }}>
            {summary.byCategory.map((row) => (
              <div key={row.category} className="chart-row">
                <span>{row.category}</span>
                <div className="chart-track"><span style={{ width: `${(row.amount / max) * 100}%` }} /></div>
                <strong>{inr(row.amount)}</strong>
              </div>
            ))}
          </div>
        )}
        <p className="hint">Ceremony budgets stay on the Events page and are not added again here.</p>
      </section>

      {unrecorded.length > 0 && (
        <section className="card">
          <h2>Bought, but not in the expense book</h2>
          <p className="hint">Add these once. If a row is already linked, use Update on the original list instead of creating another expense.</p>
          {unrecorded.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="mini">
              <span>{item.label}</span>
              <button
                className="btn btn-small"
                type="button"
                onClick={() => {
                  if (item.kind === 'purchase') recordPurchaseExpense(item.id);
                  if (item.kind === 'clothing') recordClothingExpense(item.id);
                  if (item.kind === 'gift') recordGiftExpense(item.id);
                }}
              >
                Add to expense book
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="filters">
        <SearchInput value={query} onChange={setQuery} placeholder="Search expenses" />
        <Field label="Category">
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All</option>
            {EXPENSE_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
        </Field>
      </div>
      {rows.length === 0 ? (
        <Empty title="No expenses" text="Add a payment, or record one from a purchase, outfit, or gift." />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Event</th>
                <th>Estimate</th>
                <th>Actual</th>
                <th>Paid</th>
                <th>Left</th>
                <th>Vendor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((expense) => (
                <tr key={expense.id}>
                  <td data-label="Description"><strong>{expense.description}</strong> <DemoBadge show={expense.isDemo} /></td>
                  <td data-label="Category">{expense.category}</td>
                  <td data-label="Event">{eventName(state, expense.eventId)}</td>
                  <td data-label="Estimate">{inr(expense.estimatedCost)}</td>
                  <td data-label="Actual">{inr(expense.actualCost)}</td>
                  <td data-label="Paid">{inr(expense.amountPaid)}</td>
                  <td data-label="Left">{inr(expenseRemaining(expense))}</td>
                  <td data-label="Vendor">{expense.vendor || '—'}<div className="hint">{formatDate(expense.paymentDate)}</div></td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="btn btn-small" type="button" onClick={() => { setError(null); setDraft(expense); }}>Edit</button>
                      <button className="btn btn-small" type="button" onClick={() => remove(expense)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <Modal title="Expense" wide onClose={() => setDraft(null)}>
          <form
            onSubmit={(event) => {
              submitForm(event);
              if (!draft.description.trim()) {
                setError('Please describe the expense.');
                return;
              }
              if ((draft.amountPaid ?? 0) > (draft.actualCost ?? 0) && draft.actualCost != null) {
                setError('Amount paid cannot be more than the actual cost.');
                return;
              }
              const saved = { ...draft, description: draft.description.trim() };
              if (state.expenses.some((expense) => expense.id === saved.id)) updateExpense(saved);
              else addExpense(saved);
              setDraft(null);
            }}
          >
            <div className="modal-body form-grid">
              <FormError message={error} />
              <Field label="Description"><TextInput value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
              <Field label="Category">
                <SelectInput value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map((option) => <option key={option}>{option}</option>)}
                </SelectInput>
              </Field>
              <Field label="Related event">
                <SelectInput value={draft.eventId ?? ''} onChange={(e) => setDraft({ ...draft, eventId: e.target.value || null })}>
                  <option value="">None</option>
                  {state.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                </SelectInput>
              </Field>
              <Field label="Vendor"><TextInput value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} /></Field>
              <Field label="Estimated cost (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.estimatedCost)} onChange={(e) => setDraft({ ...draft, estimatedCost: parseAmount(e.target.value) })} /></Field>
              <Field label="Actual cost (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.actualCost)} onChange={(e) => setDraft({ ...draft, actualCost: parseAmount(e.target.value) })} /></Field>
              <Field label="Amount paid (INR)"><TextInput inputMode="decimal" value={amountToInput(draft.amountPaid)} onChange={(e) => setDraft({ ...draft, amountPaid: parseAmount(e.target.value) })} /></Field>
              <Field label="Payment date"><TextInput type="date" value={draft.paymentDate ?? ''} onChange={(e) => setDraft({ ...draft, paymentDate: e.target.value || null })} /></Field>
              <p className="hint wide">Remaining payment: {inr(expenseRemaining(draft))}</p>
              <div className="wide"><Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field></div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save expense</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
