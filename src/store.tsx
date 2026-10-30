import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeed, emptyState } from './seed';
import { loadState, normalizeState, saveState } from './storage';
import type {
  AppState,
  CalendarEntry,
  ClothingItem,
  Expense,
  FamilyMember,
  Gift,
  Guest,
  InvitationPlan,
  MediaItem,
  Purchase,
  ReturnGiftPlan,
  ShoppingTrip,
  Task,
  WeddingEvent,
  WeddingProfile,
} from './types';
import { uid } from './utils';

type Updater<T> = (current: T) => T;

interface StoreValue {
  state: AppState;
  saveError: string | null;
  loadError: string | null;
  updateProfile: (patch: Partial<WeddingProfile>) => void;
  addMember: (row: FamilyMember) => void;
  updateMember: (row: FamilyMember) => void;
  deleteMember: (id: string) => void;
  addTask: (row: Task) => void;
  updateTask: (row: Task) => void;
  deleteTask: (id: string) => void;
  addEvent: (row: WeddingEvent) => void;
  updateEvent: (row: WeddingEvent) => void;
  deleteEvent: (id: string) => void;
  addEntry: (row: CalendarEntry) => void;
  updateEntry: (row: CalendarEntry) => void;
  deleteEntry: (id: string) => void;
  addPurchase: (row: Purchase) => void;
  updatePurchase: (row: Purchase) => void;
  deletePurchase: (id: string) => void;
  addTrip: (row: ShoppingTrip) => void;
  updateTrip: (row: ShoppingTrip) => void;
  deleteTrip: (id: string) => void;
  addClothing: (row: ClothingItem) => void;
  updateClothing: (row: ClothingItem) => void;
  deleteClothing: (id: string) => void;
  addGift: (row: Gift) => void;
  updateGift: (row: Gift) => void;
  deleteGift: (id: string) => void;
  updateReturnGifts: (row: ReturnGiftPlan) => void;
  addGuest: (row: Guest) => void;
  updateGuest: (row: Guest) => void;
  deleteGuest: (id: string) => void;
  importGuests: (rows: Guest[]) => void;
  updateInvitation: (row: InvitationPlan) => void;
  addExpense: (row: Expense) => void;
  updateExpense: (row: Expense) => void;
  deleteExpense: (id: string) => void;
  addMedia: (row: MediaItem) => void;
  updateMedia: (row: MediaItem) => void;
  deleteMedia: (id: string) => void;
  recordPurchaseExpense: (purchaseId: string) => void;
  recordClothingExpense: (clothingId: string) => void;
  recordGiftExpense: (giftId: string) => void;
  restoreSample: () => void;
  eraseAll: () => void;
  replaceAll: (next: AppState) => string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

function keep<T extends { id: string; isDemo: boolean }>(current: T[], seeded: T[]): T[] {
  const own = current.filter((row) => !row.isDemo);
  const ownIds = new Set(own.map((row) => row.id));
  return [...seeded.filter((row) => !ownIds.has(row.id)), ...own];
}

function applyTrip(state: AppState, trip: ShoppingTrip): AppState {
  const selected = new Set(trip.purchaseIds);
  return {
    ...state,
    trips: state.trips.map((existing) =>
      existing.id === trip.id
        ? trip
        : { ...existing, purchaseIds: existing.purchaseIds.filter((id) => !selected.has(id)) },
    ),
    purchases: state.purchases.map((purchase) => {
      if (selected.has(purchase.id)) return { ...purchase, tripId: trip.id };
      if (purchase.tripId === trip.id) return { ...purchase, tripId: null };
      return purchase;
    }),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadState);
  const [state, setState] = useState<AppState>(initial.state);
  const [saveError, setSaveError] = useState<string | null>(null);
  const loadError = initial.error;

  useEffect(() => {
    setSaveError(saveState(state));
  }, [state]);

  const change = useCallback((recipe: Updater<AppState>) => {
    setState((current) => recipe(current));
  }, []);

  const api = useMemo<StoreValue>(() => {
    const owned = <T extends { isDemo: boolean }>(row: T): T => ({ ...row, isDemo: false });
    return {
      state,
      saveError,
      loadError,
      updateProfile: (patch) => change((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      addMember: (row) => change((s) => ({ ...s, members: [owned(row), ...s.members] })),
      updateMember: (row) =>
        change((s) => ({ ...s, members: s.members.map((m) => (m.id === row.id ? owned(row) : m)) })),
      deleteMember: (id) =>
        change((s) => ({
          ...s,
          members: s.members.filter((m) => m.id !== id),
          clothing: s.clothing.filter((c) => c.personId !== id),
          tasks: s.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)),
          events: s.events.map((e) => (e.responsibleId === id ? { ...e, responsibleId: null } : e)),
          gifts: s.gifts.map((g) => (g.memberId === id ? { ...g, memberId: null } : g)),
          media: s.media.map((m) => (m.responsibleId === id ? { ...m, responsibleId: null } : m)),
          trips: s.trips.map((t) => ({ ...t, memberIds: t.memberIds.filter((mid) => mid !== id) })),
        })),
      addTask: (row) => change((s) => ({ ...s, tasks: [owned(row), ...s.tasks] })),
      updateTask: (row) => change((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === row.id ? owned(row) : t)) })),
      deleteTask: (id) => change((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      addEvent: (row) => change((s) => ({ ...s, events: [owned(row), ...s.events] })),
      updateEvent: (row) =>
        change((s) => ({ ...s, events: s.events.map((e) => (e.id === row.id ? owned(row) : e)) })),
      deleteEvent: (id) =>
        change((s) => ({
          ...s,
          events: s.events.filter((e) => e.id !== id),
          tasks: s.tasks.map((t) => (t.eventId === id ? { ...t, eventId: null } : t)),
          purchases: s.purchases.map((p) => (p.eventId === id ? { ...p, eventId: null } : p)),
          clothing: s.clothing.map((c) => (c.eventId === id ? { ...c, eventId: null } : c)),
          expenses: s.expenses.map((e) => (e.eventId === id ? { ...e, eventId: null } : e)),
          media: s.media.map((m) => (m.eventId === id ? { ...m, eventId: null } : m)),
          guests: s.guests.map((g) => ({ ...g, eventIds: g.eventIds.filter((eid) => eid !== id) })),
        })),
      addEntry: (row) => change((s) => ({ ...s, entries: [owned(row), ...s.entries] })),
      updateEntry: (row) =>
        change((s) => ({ ...s, entries: s.entries.map((e) => (e.id === row.id ? owned(row) : e)) })),
      deleteEntry: (id) => change((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) })),
      addPurchase: (row) => change((s) => ({ ...s, purchases: [owned(row), ...s.purchases] })),
      updatePurchase: (row) =>
        change((s) => ({
          ...s,
          purchases: s.purchases.map((p) => (p.id === row.id ? owned(row) : p)),
          trips: s.trips.map((t) => {
            const has = t.purchaseIds.includes(row.id);
            if (row.tripId === t.id && !has) return { ...t, purchaseIds: [...t.purchaseIds, row.id] };
            if (row.tripId !== t.id && has) return { ...t, purchaseIds: t.purchaseIds.filter((id) => id !== row.id) };
            return t;
          }),
        })),
      deletePurchase: (id) =>
        change((s) => ({
          ...s,
          purchases: s.purchases.filter((p) => p.id !== id),
          trips: s.trips.map((t) => ({ ...t, purchaseIds: t.purchaseIds.filter((pid) => pid !== id) })),
          expenses: s.expenses.map((e) => (e.linkedPurchaseId === id ? { ...e, linkedPurchaseId: null } : e)),
        })),
      addTrip: (row) => change((s) => applyTrip({ ...s, trips: [owned(row), ...s.trips] }, owned(row))),
      updateTrip: (row) => change((s) => applyTrip(s, owned(row))),
      deleteTrip: (id) =>
        change((s) => ({
          ...s,
          trips: s.trips.filter((t) => t.id !== id),
          purchases: s.purchases.map((p) => (p.tripId === id ? { ...p, tripId: null } : p)),
        })),
      addClothing: (row) => change((s) => ({ ...s, clothing: [owned(row), ...s.clothing] })),
      updateClothing: (row) =>
        change((s) => ({ ...s, clothing: s.clothing.map((c) => (c.id === row.id ? owned(row) : c)) })),
      deleteClothing: (id) =>
        change((s) => ({
          ...s,
          clothing: s.clothing.filter((c) => c.id !== id),
          expenses: s.expenses.map((e) => (e.linkedClothingId === id ? { ...e, linkedClothingId: null } : e)),
        })),
      addGift: (row) => change((s) => ({ ...s, gifts: [owned(row), ...s.gifts] })),
      updateGift: (row) => change((s) => ({ ...s, gifts: s.gifts.map((g) => (g.id === row.id ? owned(row) : g)) })),
      deleteGift: (id) =>
        change((s) => ({
          ...s,
          gifts: s.gifts.filter((g) => g.id !== id),
          expenses: s.expenses.map((e) => (e.linkedGiftId === id ? { ...e, linkedGiftId: null } : e)),
        })),
      updateReturnGifts: (row) => change((s) => ({ ...s, returnGifts: row })),
      addGuest: (row) => change((s) => ({ ...s, guests: [owned(row), ...s.guests] })),
      updateGuest: (row) =>
        change((s) => ({ ...s, guests: s.guests.map((g) => (g.id === row.id ? owned(row) : g)) })),
      deleteGuest: (id) => change((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== id) })),
      importGuests: (rows) => change((s) => ({ ...s, guests: [...rows.map(owned), ...s.guests] })),
      updateInvitation: (row) => change((s) => ({ ...s, invitation: row })),
      addExpense: (row) => change((s) => ({ ...s, expenses: [owned(row), ...s.expenses] })),
      updateExpense: (row) =>
        change((s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === row.id ? owned(row) : e)) })),
      deleteExpense: (id) => change((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })),
      addMedia: (row) => change((s) => ({ ...s, media: [owned(row), ...s.media] })),
      updateMedia: (row) =>
        change((s) => ({ ...s, media: s.media.map((m) => (m.id === row.id ? owned(row) : m)) })),
      deleteMedia: (id) => change((s) => ({ ...s, media: s.media.filter((m) => m.id !== id) })),
      recordPurchaseExpense: (purchaseId) =>
        change((s) => {
          const purchase = s.purchases.find((p) => p.id === purchaseId);
          if (!purchase) return s;
          return upsertLinkedExpense(s, {
            link: 'purchase',
            id: purchaseId,
            description: purchase.name,
            category: mapPurchase(purchase.category),
            eventId: purchase.eventId,
            estimatedCost:
              purchase.estimatedPrice == null ? null : purchase.estimatedPrice * (purchase.quantity || 1),
            actualCost: purchase.actualPrice == null ? null : purchase.actualPrice * (purchase.quantity || 1),
            vendor: purchase.shop,
          });
        }),
      recordClothingExpense: (clothingId) =>
        change((s) => {
          const item = s.clothing.find((c) => c.id === clothingId);
          if (!item) return s;
          const person = s.members.find((m) => m.id === item.personId)?.name ?? 'Family member';
          return upsertLinkedExpense(s, {
            link: 'clothing',
            id: clothingId,
            description: `${item.clothingType} · ${person}`,
            category: 'Clothing',
            eventId: item.eventId,
            estimatedCost: item.estimatedPrice,
            actualCost: item.actualPrice,
            vendor: item.shop,
          });
        }),
      recordGiftExpense: (giftId) =>
        change((s) => {
          const gift = s.gifts.find((g) => g.id === giftId);
          if (!gift) return s;
          return upsertLinkedExpense(s, {
            link: 'gift',
            id: giftId,
            description: `${gift.description || 'Gift'} · ${gift.recipient}`,
            category: gift.kind === 'Bhaat' ? 'Bhaat' : gift.kind === 'Guest return gifts' ? 'Guest return gifts' : 'Gifts',
            eventId: null,
            estimatedCost: gift.estimatedCost == null ? null : gift.estimatedCost * (gift.quantity || 1),
            actualCost: gift.actualCost == null ? null : gift.actualCost * (gift.quantity || 1),
            vendor: '',
          });
        }),
      restoreSample: () =>
        change((s) => {
          const seed = createSeed();
          return {
            ...seed,
            profile: s.profile,
            members: keep(s.members, seed.members),
            tasks: keep(s.tasks, seed.tasks),
            events: keep(s.events, seed.events),
            entries: keep(s.entries, seed.entries),
            purchases: keep(s.purchases, seed.purchases),
            trips: keep(s.trips, seed.trips),
            clothing: keep(s.clothing, seed.clothing),
            gifts: keep(s.gifts, seed.gifts),
            guests: keep(s.guests, seed.guests),
            expenses: keep(s.expenses, seed.expenses),
            media: keep(s.media, seed.media),
            returnGifts: s.returnGifts,
            invitation: s.invitation,
          };
        }),
      eraseAll: () => change((s) => emptyState(s.profile)),
      replaceAll: (next) => {
        const normalized = normalizeState(next);
        if (!normalized) return 'That file is not a ShaadiSaathi backup.';
        setState(normalized);
        return null;
      },
    };
  }, [change, loadError, saveError, state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function mapPurchase(category: string): string {
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

function upsertLinkedExpense(
  state: AppState,
  input: {
    link: 'purchase' | 'clothing' | 'gift';
    id: string;
    description: string;
    category: string;
    eventId: string | null;
    estimatedCost: number | null;
    actualCost: number | null;
    vendor: string;
  },
): AppState {
  const match = (expense: Expense) =>
    (input.link === 'purchase' && expense.linkedPurchaseId === input.id) ||
    (input.link === 'clothing' && expense.linkedClothingId === input.id) ||
    (input.link === 'gift' && expense.linkedGiftId === input.id);
  const existing = state.expenses.find(match);
  if (existing) {
    return {
      ...state,
      expenses: state.expenses.map((expense) =>
        expense.id === existing.id
          ? {
              ...expense,
              description: input.description,
              category: input.category,
              eventId: input.eventId,
              estimatedCost: input.estimatedCost,
              actualCost: input.actualCost,
              amountPaid: input.actualCost ?? expense.amountPaid,
              vendor: input.vendor || expense.vendor,
              isDemo: false,
            }
          : expense,
      ),
    };
  }
  const created: Expense = {
    id: uid(),
    description: input.description,
    category: input.category,
    eventId: input.eventId,
    estimatedCost: input.estimatedCost,
    actualCost: input.actualCost,
    amountPaid: input.actualCost,
    vendor: input.vendor,
    paymentDate: null,
    notes: 'Added from another list so the amount is counted once in the expense book.',
    linkedPurchaseId: input.link === 'purchase' ? input.id : null,
    linkedClothingId: input.link === 'clothing' ? input.id : null,
    linkedGiftId: input.link === 'gift' ? input.id : null,
    isDemo: false,
  };
  return { ...state, expenses: [created, ...state.expenses] };
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used within StoreProvider');
  return value;
}
