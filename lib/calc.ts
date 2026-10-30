import { addDays } from "./format";
import type {
  AgendaItem,
  AppState,
  ClothingItem,
  Expense,
  Gift,
  Purchase,
  ShoppingTrip,
} from "./types";

export function money(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function sumMoney(values: Array<number | null | undefined>) {
  const amounts = values.map(money).filter((value): value is number => value != null);
  if (!amounts.length) return null;
  return amounts.reduce((total, value) => total + value, 0);
}

export function lineTotal(price: number | null | undefined, quantity: number) {
  const amount = money(price);
  if (amount == null) return null;
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  return amount * qty;
}

export function personName(state: AppState, id: string) {
  if (!id) return "";
  return state.people.find((person) => person.id === id)?.name ?? "";
}

export function eventName(state: AppState, id: string) {
  if (!id) return "";
  return state.events.find((event) => event.id === id)?.name ?? "";
}

export function taskProgress(state: AppState) {
  const total = state.tasks.length;
  const done = state.tasks.filter((task) => task.status === "completed").length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}

export function isPendingPurchase(status: Purchase["status"]) {
  return status === "to_buy" || status === "shortlisted";
}

export function pendingPurchases(state: AppState) {
  return state.purchases.filter((item) => isPendingPurchase(item.status));
}

export function pendingGifts(state: AppState) {
  return state.gifts.filter((gift) => gift.status !== "ready" && gift.status !== "given");
}

export function pendingClothing(state: AppState) {
  return state.clothing.filter((item) => isPendingPurchase(item.status));
}

export function expenseOutstanding(expense: Expense) {
  if (expense.actualCost == null && expense.amountPaid == null) return null;
  return Math.max(0, (money(expense.actualCost) ?? 0) - (money(expense.amountPaid) ?? 0));
}

export function budgetSummary(state: AppState) {
  const estimated = sumMoney(state.expenses.map((expense) => expense.estimatedCost));
  const actual = sumMoney(state.expenses.map((expense) => expense.actualCost));
  const paid = sumMoney(state.expenses.map((expense) => expense.amountPaid));
  const outstanding = sumMoney(state.expenses.map(expenseOutstanding));
  const budget = money(state.settings.totalBudget);
  const remaining = budget == null ? null : budget - (actual ?? 0);
  return { estimated, actual, paid, outstanding, budget, remaining };
}

export function categoryTotals(expenses: Expense[], mode: "estimated" | "actual" | "paid") {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const value = money(
      mode === "estimated" ? expense.estimatedCost : mode === "actual" ? expense.actualCost : expense.amountPaid,
    );
    if (value == null) continue;
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + value);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

export function eventSpend(state: AppState, eventId: string) {
  const linked = state.expenses.filter((expense) => expense.eventId === eventId);
  return {
    estimated: sumMoney(linked.map((expense) => expense.estimatedCost)),
    actual: sumMoney(linked.map((expense) => expense.actualCost)),
    paid: sumMoney(linked.map((expense) => expense.amountPaid)),
    count: linked.length,
  };
}

export function collectAgenda(state: AppState): AgendaItem[] {
  const items: AgendaItem[] = [];

  for (const event of state.events) {
    if (!event.date || event.status === "cancelled") continue;
    items.push({
      key: `event-${event.id}`,
      source: "event",
      sourceId: event.id,
      title: event.name,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      label: "Event",
      meta: event.venue,
      open: event.status !== "done",
    });
  }

  for (const task of state.tasks) {
    if (!task.deadline) continue;
    items.push({
      key: `task-${task.id}`,
      source: "task",
      sourceId: task.id,
      title: task.title,
      date: task.deadline,
      startTime: "",
      endTime: "",
      label: "Task deadline",
      meta: task.category,
      open: task.status !== "completed",
    });
  }

  for (const trip of state.trips) {
    if (!trip.date) continue;
    items.push({
      key: `trip-${trip.id}`,
      source: "trip",
      sourceId: trip.id,
      title: trip.name,
      date: trip.date,
      startTime: trip.departureTime,
      endTime: "",
      label: "Shopping trip",
      meta: trip.destination,
      open: true,
    });
  }

  for (const entry of state.calendarEntries) {
    if (!entry.date) continue;
    items.push({
      key: `entry-${entry.id}`,
      source: "entry",
      sourceId: entry.id,
      title: entry.title,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      label: entry.kind === "payment" ? "Payment deadline" : entry.kind === "shopping" ? "Shopping" : entry.kind === "appointment" ? "Appointment" : "Calendar",
      meta: entry.notes,
      open: true,
    });
  }

  for (const expense of state.expenses) {
    if (!expense.paymentDate) continue;
    const outstanding = expenseOutstanding(expense);
    items.push({
      key: `payment-${expense.id}`,
      source: "payment",
      sourceId: expense.id,
      title: expense.description,
      date: expense.paymentDate,
      startTime: "",
      endTime: "",
      label: "Payment date",
      meta: expense.vendor,
      open: outstanding == null || outstanding > 0,
    });
  }

  for (const item of state.clothing) {
    if (item.fittingDate) {
      items.push({
        key: `fitting-${item.id}`,
        source: "fitting",
        sourceId: item.id,
        title: `Fitting: ${item.clothingType}`,
        date: item.fittingDate,
        startTime: "",
        endTime: "",
        label: "Fitting",
        meta: personName(state, item.personId),
        open: item.alterationStatus !== "done",
      });
    }
    if (item.deliveryDeadline && item.status !== "delivered" && item.status !== "cancelled") {
      items.push({
        key: `cloth-due-${item.id}`,
        source: "clothing",
        sourceId: item.id,
        title: `Delivery: ${item.clothingType}`,
        date: item.deliveryDeadline,
        startTime: "",
        endTime: "",
        label: "Clothing deadline",
        meta: personName(state, item.personId),
        open: true,
      });
    }
  }

  for (const purchase of state.purchases) {
    if (!purchase.deadline || !isPendingPurchase(purchase.status)) continue;
    items.push({
      key: `purchase-${purchase.id}`,
      source: "purchase",
      sourceId: purchase.id,
      title: purchase.name,
      date: purchase.deadline,
      startTime: "",
      endTime: "",
      label: "Purchase deadline",
      meta: purchase.shop,
      open: true,
    });
  }

  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.startTime || "99:99").localeCompare(b.startTime || "99:99");
  });
}

export function itemsOnDate(items: AgendaItem[], date: string) {
  return items.filter((item) => item.date === date);
}

export function clothingAlerts(clothing: ClothingItem[], today: string) {
  const soon = addDays(today, 14);
  const openAlteration = (item: ClothingItem) =>
    item.alterationStatus === "pending" || item.alterationStatus === "in_progress";
  return {
    toBuy: clothing.filter((item) => isPendingPurchase(item.status)),
    alterations: clothing.filter(openAlteration),
    fittingSoon: clothing.filter(
      (item) => item.fittingDate && item.fittingDate >= today && item.fittingDate <= soon && item.alterationStatus !== "done",
    ),
    fittingOverdue: clothing.filter(
      (item) => item.fittingDate && item.fittingDate < today && openAlteration(item),
    ),
    deliverySoon: clothing.filter(
      (item) =>
        item.deliveryDeadline &&
        item.deliveryDeadline >= today &&
        item.deliveryDeadline <= soon &&
        item.status !== "delivered" &&
        item.status !== "cancelled",
    ),
    deliveryOverdue: clothing.filter(
      (item) =>
        item.deliveryDeadline &&
        item.deliveryDeadline < today &&
        item.status !== "delivered" &&
        item.status !== "cancelled",
    ),
  };
}

export function groupPurchasesByPlace(purchases: Purchase[]) {
  const groups = new Map<string, Purchase[]>();
  for (const purchase of purchases.filter((item) => isPendingPurchase(item.status))) {
    const key = purchase.shop.trim() || purchase.market.trim() || "Shop not set";
    groups.set(key, [...(groups.get(key) ?? []), purchase]);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

export function tripEstimate(trip: ShoppingTrip, purchases: Purchase[]) {
  const items = purchases.filter((item) => trip.purchaseIds.includes(item.id) && item.status !== "cancelled");
  const priced = items
    .map((item) => lineTotal(item.estimatedPrice, item.quantity))
    .filter((value): value is number => value != null);
  return {
    items,
    total: priced.length ? priced.reduce((sum, value) => sum + value, 0) : null,
    pricedCount: priced.length,
    missingPrices: items.length - priced.length,
  };
}

export interface BhaatRecipient {
  name: string;
  relationship: string;
  forFamily: boolean;
  gifts: Gift[];
  required: number;
  purchased: number;
  pending: number;
  estimated: number | null;
  actual: number | null;
}

const BOUGHT: Gift["status"][] = ["purchased", "packaging_pending", "ready", "given"];

export function bhaatSummary(gifts: Gift[]) {
  const rows = gifts.filter((gift) => gift.occasion === "Bhaat");
  const groups = new Map<string, Gift[]>();
  for (const gift of rows) {
    const key = gift.recipientName.trim() || "Unnamed recipient";
    groups.set(key, [...(groups.get(key) ?? []), gift]);
  }
  const recipients: BhaatRecipient[] = [...groups.entries()].map(([name, list]) => {
    const required = list.reduce((sum, gift) => sum + (gift.quantity || 0), 0);
    const purchased = list
      .filter((gift) => BOUGHT.includes(gift.status))
      .reduce((sum, gift) => sum + (gift.quantity || 0), 0);
    return {
      name,
      relationship: list[0]?.relationship ?? "",
      forFamily: list.some((gift) => gift.forFamily),
      gifts: list,
      required,
      purchased,
      pending: Math.max(0, required - purchased),
      estimated: sumMoney(list.map((gift) => lineTotal(gift.estimatedCost, gift.quantity))),
      actual: sumMoney(list.map((gift) => lineTotal(gift.actualCost, gift.quantity))),
    };
  });
  return {
    recipients,
    required: recipients.reduce((sum, row) => sum + row.required, 0),
    purchased: recipients.reduce((sum, row) => sum + row.purchased, 0),
    pending: recipients.reduce((sum, row) => sum + row.pending, 0),
    estimated: sumMoney(recipients.map((row) => row.estimated)),
    actual: sumMoney(recipients.map((row) => row.actual)),
  };
}

export function returnGiftMath(plan: AppState["returnGifts"]) {
  const expected = money(plan.expectedQuantity);
  const purchased = money(plan.purchasedQuantity);
  const distributed = money(plan.distributedQuantity);
  const cost = money(plan.costPerItem);
  return {
    expected,
    purchased,
    distributed,
    remaining: purchased == null || distributed == null ? null : purchased - distributed,
    shortfall: expected != null && purchased != null && purchased < expected,
    overDistributed: purchased != null && distributed != null && distributed > purchased,
    totalCost: purchased == null || cost == null ? null : purchased * cost,
  };
}

export function guestStats(state: AppState) {
  const people = (guest: AppState["guests"][number]) => guest.memberCount || 0;
  return {
    households: state.guests.length,
    people: state.guests.reduce((sum, guest) => sum + people(guest), 0),
    invitePendingHouseholds: state.guests.filter((guest) => guest.invitationStatus === "not_sent").length,
    invitePendingPeople: state.guests
      .filter((guest) => guest.invitationStatus === "not_sent")
      .reduce((sum, guest) => sum + people(guest), 0),
    confirmedPeople: state.guests
      .filter((guest) => guest.rsvpStatus === "coming")
      .reduce((sum, guest) => sum + people(guest), 0),
    declinedPeople: state.guests
      .filter((guest) => guest.rsvpStatus === "not_coming")
      .reduce((sum, guest) => sum + people(guest), 0),
    staying: state.guests.filter((guest) => guest.accommodation.trim()).length,
  };
}

export function matchesDeadline(date: string, filter: string, today: string) {
  if (filter === "any") return true;
  if (filter === "none") return !date;
  if (!date) return false;
  if (filter === "overdue") return date < today;
  if (filter === "today") return date === today;
  if (filter === "week") return date >= today && date <= addDays(today, 7);
  if (filter === "later") return date > addDays(today, 7);
  return true;
}

export function searchMatch(query: string, parts: Array<string | null | undefined>) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => (part ?? "").toLowerCase().includes(needle));
}
