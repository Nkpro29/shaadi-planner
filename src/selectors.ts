import { EXPENSE_CATEGORIES } from './constants';
import type { AgendaItem, AppState, Expense, Gift, Purchase, PurchaseStatus } from './types';
import { daysBetween, lineTotal, priorityRank, todayISO } from './utils';

export function memberName(state: AppState, id?: string | null): string {
  if (!id) return 'Unassigned';
  return state.members.find((m) => m.id === id)?.name ?? 'Removed person';
}

export function eventName(state: AppState, id?: string | null): string {
  if (!id) return '—';
  return state.events.find((e) => e.id === id)?.name ?? 'Removed event';
}

export function isOverdue(date?: string | null, inactive = false): boolean {
  if (!date || inactive) return false;
  return daysBetween(todayISO(), date) < 0;
}

export function isSoon(date?: string | null, within = 14): boolean {
  if (!date) return false;
  const d = daysBetween(todayISO(), date);
  return d >= 0 && d <= within;
}

const pendingPurchase: PurchaseStatus[] = ['To Buy', 'Shortlisted'];

export function taskProgress(state: AppState) {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.status === 'Completed').length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function overdueTasks(state: AppState) {
  return state.tasks
    .filter((t) => isOverdue(t.deadline, t.status === 'Completed'))
    .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''));
}

export function tasksDueOn(state: AppState, date: string) {
  return state.tasks.filter((t) => t.deadline === date && t.status !== 'Completed');
}

export function upcomingEvents(state: AppState, limit = 5) {
  const today = todayISO();
  return state.events
    .filter((e) => e.date && e.date >= today && e.status !== 'Cancelled')
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.startTime.localeCompare(b.startTime))
    .slice(0, limit);
}

export function undatedEvents(state: AppState) {
  return state.events.filter((e) => !e.date && e.status !== 'Cancelled');
}

export function pendingPurchases(state: AppState) {
  return state.purchases.filter((p) => pendingPurchase.includes(p.status));
}

export function pendingGifts(state: AppState) {
  return state.gifts.filter((g) => g.status !== 'Given');
}

export function pendingClothing(state: AppState) {
  return state.clothing.filter((c) => pendingPurchase.includes(c.status));
}

export function purchaseCategoryToExpense(category: string): (typeof EXPENSE_CATEGORIES)[number] {
  const clothing = [
    'Bridal clothes',
    "Groom's clothes",
    "Groom's parents' clothes",
    "Groom's siblings' clothes",
    'Extended family clothing',
    "Bride's family clothing",
    'Footwear',
  ];
  if (clothing.includes(category)) return 'Clothing';
  if (category === 'Jewellery') return 'Jewellery';
  if (category === 'Gifts') return 'Gifts';
  if (category === 'Bhaat gifts') return 'Bhaat';
  if (category === 'Guest return gifts') return 'Guest return gifts';
  if (category === 'Wedding cards') return 'Invitations';
  if (category === 'Decoration') return 'Decoration';
  return 'Miscellaneous';
}

export function giftCategory(kind: Gift['kind']): (typeof EXPENSE_CATEGORIES)[number] {
  if (kind === 'Bhaat') return 'Bhaat';
  if (kind === 'Guest return gifts') return 'Guest return gifts';
  return 'Gifts';
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, n) => acc + (n ?? 0), 0);
}

export function expenseRemaining(expense: Expense): number {
  return Math.max(0, (expense.actualCost ?? 0) - (expense.amountPaid ?? 0));
}

export interface BudgetSummary {
  overall: number | null;
  recordedEstimated: number;
  recordedActual: number;
  recordedPaid: number;
  outstanding: number;
  unlinkedPlanned: number;
  totalEstimated: number;
  remaining: number | null;
  byCategory: { category: string; amount: number }[];
}

export function budgetSummary(state: AppState): BudgetSummary {
  const linkedPurchases = new Set(
    state.expenses.map((e) => e.linkedPurchaseId).filter((id): id is string => Boolean(id)),
  );
  const linkedClothing = new Set(
    state.expenses.map((e) => e.linkedClothingId).filter((id): id is string => Boolean(id)),
  );
  const linkedGifts = new Set(
    state.expenses.map((e) => e.linkedGiftId).filter((id): id is string => Boolean(id)),
  );

  const recordedEstimated = sum(state.expenses.map((e) => e.estimatedCost));
  const recordedActual = sum(state.expenses.map((e) => e.actualCost));
  const recordedPaid = sum(state.expenses.map((e) => e.amountPaid));
  const outstanding = sum(state.expenses.map(expenseRemaining));

  const purchasePlanned = state.purchases
    .filter((p) => !linkedPurchases.has(p.id) && p.status !== 'Cancelled')
    .map((p) => lineTotal(p.estimatedPrice, p.quantity));
  const clothingPlanned = state.clothing
    .filter((c) => !linkedClothing.has(c.id) && c.status !== 'Cancelled')
    .map((c) => c.estimatedPrice);
  const giftPlanned = state.gifts
    .filter((g) => !linkedGifts.has(g.id))
    .map((g) => lineTotal(g.estimatedCost, g.quantity));

  const hasReturnExpense = state.expenses.some(
    (e) => e.category === 'Guest return gifts' && ((e.estimatedCost ?? 0) > 0 || (e.actualCost ?? 0) > 0),
  );
  const returnEstimate =
    !hasReturnExpense && state.returnGifts.costPerItem != null
      ? state.returnGifts.costPerItem * (state.returnGifts.expectedQty || 0)
      : 0;

  const unlinkedPlanned = sum(purchasePlanned) + sum(clothingPlanned) + sum(giftPlanned) + returnEstimate;
  const forecastFromExpenses = sum(
    state.expenses.map((e) => (e.actualCost != null ? e.actualCost : e.estimatedCost)),
  );
  const totalEstimated = forecastFromExpenses + unlinkedPlanned;
  const overall = state.profile.totalBudget;
  const remaining = overall == null ? null : overall - recordedActual;

  const buckets = new Map<string, number>();
  for (const category of EXPENSE_CATEGORIES) buckets.set(category, 0);
  for (const e of state.expenses) {
    const key = buckets.has(e.category) ? e.category : 'Miscellaneous';
    buckets.set(key, (buckets.get(key) ?? 0) + (e.actualCost != null ? e.actualCost : e.estimatedCost ?? 0));
  }
  for (const p of state.purchases) {
    if (linkedPurchases.has(p.id) || p.status === 'Cancelled') continue;
    const key = purchaseCategoryToExpense(p.category);
    buckets.set(key, (buckets.get(key) ?? 0) + (lineTotal(p.estimatedPrice, p.quantity) ?? 0));
  }
  for (const c of state.clothing) {
    if (linkedClothing.has(c.id) || c.status === 'Cancelled') continue;
    buckets.set('Clothing', (buckets.get('Clothing') ?? 0) + (c.estimatedPrice ?? 0));
  }
  for (const g of state.gifts) {
    if (linkedGifts.has(g.id)) continue;
    const key = giftCategory(g.kind);
    buckets.set(key, (buckets.get(key) ?? 0) + (lineTotal(g.estimatedCost, g.quantity) ?? 0));
  }
  if (returnEstimate) {
    buckets.set('Guest return gifts', (buckets.get('Guest return gifts') ?? 0) + returnEstimate);
  }

  const byCategory = [...buckets.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    overall,
    recordedEstimated,
    recordedActual,
    recordedPaid,
    outstanding,
    unlinkedPlanned,
    totalEstimated,
    remaining,
    byCategory,
  };
}

export function eventSpending(state: AppState, eventId: string) {
  const rows = state.expenses.filter((e) => e.eventId === eventId);
  return {
    estimated: sum(rows.map((e) => e.estimatedCost)),
    actual: sum(rows.map((e) => e.actualCost)),
    paid: sum(rows.map((e) => e.amountPaid)),
  };
}

export function collectAgenda(state: AppState): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const event of state.events) {
    if (!event.date || event.status === 'Cancelled') continue;
    items.push({
      key: `event:${event.id}`,
      source: 'event',
      sourceId: event.id,
      title: event.name,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      kindLabel: 'Event',
    });
  }
  for (const task of state.tasks) {
    if (!task.deadline) continue;
    items.push({
      key: `task:${task.id}`,
      source: 'task',
      sourceId: task.id,
      title: task.title,
      date: task.deadline,
      startTime: '',
      endTime: '',
      kindLabel: task.status === 'Completed' ? 'Task done' : 'Task due',
    });
  }
  for (const trip of state.trips) {
    if (!trip.date) continue;
    items.push({
      key: `trip:${trip.id}`,
      source: 'trip',
      sourceId: trip.id,
      title: trip.name,
      date: trip.date,
      startTime: trip.departureTime,
      endTime: '',
      kindLabel: 'Shopping trip',
    });
  }
  for (const entry of state.entries) {
    if (!entry.date) continue;
    items.push({
      key: `entry:${entry.id}`,
      source: 'entry',
      sourceId: entry.id,
      title: entry.title,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      kindLabel: entry.kind,
    });
  }
  for (const expense of state.expenses) {
    if (!expense.paymentDate) continue;
    items.push({
      key: `expense:${expense.id}`,
      source: 'expense',
      sourceId: expense.id,
      title: expense.description,
      date: expense.paymentDate,
      startTime: '',
      endTime: '',
      kindLabel: 'Payment',
    });
  }
  for (const item of state.clothing) {
    const person = memberName(state, item.personId);
    if (item.fittingDate) {
      items.push({
        key: `clothing-fitting:${item.id}`,
        source: 'clothing-fitting',
        sourceId: item.id,
        title: `Fitting · ${person}`,
        date: item.fittingDate,
        startTime: '',
        endTime: '',
        kindLabel: 'Fitting',
      });
    }
    if (item.deliveryDeadline) {
      items.push({
        key: `clothing-delivery:${item.id}`,
        source: 'clothing-delivery',
        sourceId: item.id,
        title: `Outfit delivery · ${person}`,
        date: item.deliveryDeadline,
        startTime: '',
        endTime: '',
        kindLabel: 'Delivery',
      });
    }
  }
  for (const item of state.media) {
    if (!item.deadline || item.status === 'Delivered') continue;
    items.push({
      key: `media:${item.id}`,
      source: 'media',
      sourceId: item.id,
      title: item.name,
      date: item.deadline,
      startTime: '',
      endTime: '',
      kindLabel: 'Creative deadline',
    });
  }
  for (const purchase of state.purchases) {
    if (!purchase.deadline || purchase.status === 'Purchased' || purchase.status === 'Delivered' || purchase.status === 'Cancelled') {
      continue;
    }
    items.push({
      key: `purchase:${purchase.id}`,
      source: 'purchase',
      sourceId: purchase.id,
      title: purchase.name,
      date: purchase.deadline,
      startTime: '',
      endTime: '',
      kindLabel: 'Purchase deadline',
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title));
}

export function agendaOn(state: AppState, date: string) {
  return collectAgenda(state).filter((item) => item.date === date);
}

export function shopGroups(purchases: Purchase[]) {
  const open = purchases.filter((p) => pendingPurchase.includes(p.status));
  const map = new Map<string, Purchase[]>();
  for (const item of open) {
    const key = item.shop.trim() || 'Shop not set';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([shop, items]) => ({ shop, items }))
    .sort((a, b) => b.items.length - a.items.length || a.shop.localeCompare(b.shop));
}

export function bhaatSummary(state: AppState) {
  const gifts = state.gifts.filter((g) => g.kind === 'Bhaat');
  const bought = gifts.filter((g) => ['Purchased', 'Packaging Pending', 'Ready', 'Given'].includes(g.status));
  const pending = gifts.filter((g) => !bought.includes(g));
  const recipients = new Set(gifts.map((g) => g.recipient.trim()).filter(Boolean));
  return {
    gifts,
    recipients: recipients.size,
    quantity: sum(gifts.map((g) => g.quantity)),
    purchasedQty: sum(bought.map((g) => g.quantity)),
    pendingQty: sum(pending.map((g) => g.quantity)),
    estimated: sum(gifts.map((g) => lineTotal(g.estimatedCost, g.quantity))),
    actual: sum(gifts.map((g) => lineTotal(g.actualCost, g.quantity))),
  };
}

export function guestStats(state: AppState) {
  const people = (rows: typeof state.guests) => rows.reduce((n, g) => n + (g.memberCount || 1), 0);
  const invited = state.guests.filter((g) => g.invitationStatus === 'Sent' || g.invitationStatus === 'Delivered');
  const pending = state.guests.filter((g) => g.invitationStatus === 'Not Sent' || g.invitationStatus === 'Draft Ready');
  const attending = state.guests.filter((g) => g.rsvpStatus === 'Attending');
  const declined = state.guests.filter((g) => g.rsvpStatus === 'Not Attending');
  return {
    households: state.guests.length,
    invitedHouseholds: invited.length,
    invitedPeople: people(invited),
    pendingHouseholds: pending.length,
    confirmedPeople: people(attending),
    confirmedHouseholds: attending.length,
    declinedHouseholds: declined.length,
    declinedPeople: people(declined),
  };
}

export function clothingAttention(state: AppState) {
  return state.clothing.filter((item) => {
    const openPurchase = pendingPurchase.includes(item.status);
    const fittingRisk =
      item.fittingDate &&
      item.alterationStatus !== 'Done' &&
      (isOverdue(item.fittingDate) || isSoon(item.fittingDate));
    const alterationRisk =
      (item.alterationStatus === 'Pending' || item.alterationStatus === 'In Progress') &&
      (isOverdue(item.deliveryDeadline) || isSoon(item.deliveryDeadline) || isSoon(item.fittingDate));
    const deliveryRisk = openPurchase && (isOverdue(item.deliveryDeadline) || isSoon(item.deliveryDeadline));
    return Boolean(fittingRisk || alterationRisk || deliveryRisk);
  });
}

export function sortTasks<T extends { deadline: string | null; priority: AppState['tasks'][number]['priority']; title: string }>(
  rows: T[],
) {
  return [...rows].sort((a, b) => {
    if (a.deadline && b.deadline) {
      const byDate = a.deadline.localeCompare(b.deadline);
      if (byDate) return byDate;
    } else if (a.deadline) return -1;
    else if (b.deadline) return 1;
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority) return byPriority;
    return a.title.localeCompare(b.title);
  });
}

export function matchesQuery(query: string, parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((part) => (part ?? '').toLowerCase().includes(q));
}
