import { clothingPurchaseCategory } from "./constants";
import { uid } from "./format";
import { buildSampleState } from "./sample";
import type {
  AppState,
  CalendarEntry,
  ClothingItem,
  CustomLookPiece,
  Expense,
  Gift,
  GiftStatus,
  Guest,
  InvitationPlan,
  LookPerson,
  LookStatus,
  MediaItem,
  Person,
  Purchase,
  PurchaseStatus,
  ReturnGiftPlan,
  ShoppingTrip,
  Task,
  TaskStatus,
  WeddingEvent,
  WeddingSettings,
} from "./types";

function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((entry) => entry.id === item.id)
    ? list.map((entry) => (entry.id === item.id ? item : entry))
    : [...list, item];
}

function giftStatusFromPurchase(status: PurchaseStatus): GiftStatus | null {
  if (status === "to_buy" || status === "shortlisted") return "to_buy";
  if (status === "purchased") return "purchased";
  if (status === "delivered") return "ready";
  return null;
}

function purchaseStatusFromGift(status: GiftStatus): PurchaseStatus {
  if (status === "to_decide" || status === "to_buy") return "to_buy";
  if (status === "purchased" || status === "packaging_pending") return "purchased";
  return "delivered";
}

export function saveSettings(state: AppState, settings: WeddingSettings): AppState {
  return { ...state, settings: { ...settings, timezone: "Asia/Kolkata" } };
}

export function savePerson(state: AppState, person: Person): AppState {
  return { ...state, people: upsert(state.people, { ...person, isSample: false }) };
}

export function deletePerson(state: AppState, id: string): AppState {
  return {
    ...state,
    people: state.people.filter((person) => person.id !== id),
    clothing: state.clothing.filter((item) => item.personId !== id),
    tasks: state.tasks.map((task) => (task.assigneeId === id ? { ...task, assigneeId: "" } : task)),
    events: state.events.map((event) =>
      event.responsiblePersonId === id ? { ...event, responsiblePersonId: "" } : event,
    ),
    trips: state.trips.map((trip) => ({ ...trip, memberIds: trip.memberIds.filter((memberId) => memberId !== id) })),
    gifts: state.gifts.map((gift) => (gift.recipientId === id ? { ...gift, recipientId: "" } : gift)),
    media: state.media.map((item) =>
      item.responsiblePersonId === id ? { ...item, responsiblePersonId: "" } : item,
    ),
    purchases: state.purchases.map((item) => (item.recipientId === id ? { ...item, recipientId: "" } : item)),
  };
}

export function saveEvent(state: AppState, event: WeddingEvent): AppState {
  return { ...state, events: upsert(state.events, { ...event, isSample: false }) };
}

export function deleteEvent(state: AppState, id: string): AppState {
  return {
    ...state,
    events: state.events.filter((event) => event.id !== id),
    tasks: state.tasks.map((task) => (task.eventId === id ? { ...task, eventId: "" } : task)),
    purchases: state.purchases.map((item) => (item.eventId === id ? { ...item, eventId: "" } : item)),
    clothing: state.clothing.map((item) => (item.eventId === id ? { ...item, eventId: "" } : item)),
    expenses: state.expenses.map((item) => (item.eventId === id ? { ...item, eventId: "" } : item)),
    guests: state.guests.map((guest) => ({ ...guest, eventIds: guest.eventIds.filter((eventId) => eventId !== id) })),
    media: state.media.map((item) => (item.eventId === id ? { ...item, eventId: "" } : item)),
    calendarEntries: state.calendarEntries.map((entry) =>
      entry.relatedEventId === id ? { ...entry, relatedEventId: "" } : entry,
    ),
  };
}

export function toggleChecklist(state: AppState, eventId: string, itemId: string): AppState {
  return {
    ...state,
    events: state.events.map((event) =>
      event.id === eventId
        ? {
            ...event,
            isSample: false,
            checklist: event.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
          }
        : event,
    ),
  };
}

export function saveTask(state: AppState, task: Task): AppState {
  return { ...state, tasks: upsert(state.tasks, { ...task, isSample: false }) };
}

export function deleteTask(state: AppState, id: string): AppState {
  return { ...state, tasks: state.tasks.filter((task) => task.id !== id) };
}

export function setTaskStatus(state: AppState, id: string, status: TaskStatus): AppState {
  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, status, isSample: false } : task)),
  };
}

export function saveCalendarEntry(state: AppState, entry: CalendarEntry): AppState {
  return { ...state, calendarEntries: upsert(state.calendarEntries, { ...entry, isSample: false }) };
}

export function deleteCalendarEntry(state: AppState, id: string): AppState {
  return { ...state, calendarEntries: state.calendarEntries.filter((entry) => entry.id !== id) };
}

export function savePurchase(state: AppState, purchase: Purchase): AppState {
  const next = { ...purchase, isSample: false };
  const purchases = upsert(state.purchases, next);
  const trips = state.trips.map((trip) => {
    const included = trip.purchaseIds.includes(next.id);
    if (next.tripId === trip.id && !included) return { ...trip, purchaseIds: [...trip.purchaseIds, next.id] };
    if (next.tripId !== trip.id && included) {
      return { ...trip, purchaseIds: trip.purchaseIds.filter((id) => id !== next.id) };
    }
    return trip;
  });
  const clothing = next.clothingId
    ? state.clothing.map((item) =>
        item.id === next.clothingId
          ? {
              ...item,
              status: next.status,
              actualPrice: next.actualPrice,
              estimatedPrice: next.estimatedPrice,
              shop: next.shop || item.shop,
              isSample: false,
            }
          : item,
      )
    : state.clothing;
  const mappedGift = next.giftId ? giftStatusFromPurchase(next.status) : null;
  const gifts =
    next.giftId && mappedGift
      ? state.gifts.map((gift) =>
          gift.id === next.giftId
            ? { ...gift, status: mappedGift, actualCost: next.actualPrice ?? gift.actualCost, isSample: false }
            : gift,
        )
      : state.gifts;
  return { ...state, purchases, trips, clothing, gifts };
}

export function deletePurchase(state: AppState, id: string): AppState {
  return {
    ...state,
    purchases: state.purchases.filter((item) => item.id !== id),
    trips: state.trips.map((trip) => ({ ...trip, purchaseIds: trip.purchaseIds.filter((itemId) => itemId !== id) })),
  };
}

export function saveTrip(state: AppState, trip: ShoppingTrip): AppState {
  const next = { ...trip, isSample: false };
  const trips = upsert(state.trips, next).map((item) =>
    item.id === next.id ? item : { ...item, purchaseIds: item.purchaseIds.filter((id) => !next.purchaseIds.includes(id)) },
  );
  const purchases = state.purchases.map((item) => {
    if (next.purchaseIds.includes(item.id)) return { ...item, tripId: next.id };
    if (item.tripId === next.id) return { ...item, tripId: "" };
    return item;
  });
  return { ...state, trips, purchases };
}

export function deleteTrip(state: AppState, id: string): AppState {
  return {
    ...state,
    trips: state.trips.filter((trip) => trip.id !== id),
    purchases: state.purchases.map((item) => (item.tripId === id ? { ...item, tripId: "" } : item)),
  };
}

export function saveClothing(state: AppState, item: ClothingItem): AppState {
  const next = { ...item, isSample: false };
  const clothing = upsert(state.clothing, next);
  const purchases = state.purchases.map((purchase) =>
    purchase.clothingId === next.id
      ? {
          ...purchase,
          status: next.status,
          estimatedPrice: next.estimatedPrice,
          actualPrice: next.actualPrice,
          shop: next.shop,
          deadline: next.deliveryDeadline || purchase.deadline,
          isSample: false,
        }
      : purchase,
  );
  return { ...state, clothing, purchases };
}

export function deleteClothing(state: AppState, id: string): AppState {
  return {
    ...state,
    clothing: state.clothing.filter((item) => item.id !== id),
    purchases: state.purchases.map((item) => (item.clothingId === id ? { ...item, clothingId: "" } : item)),
  };
}

export function addClothingToShopping(state: AppState, clothingId: string): AppState {
  if (state.purchases.some((item) => item.clothingId === clothingId)) return state;
  const item = state.clothing.find((entry) => entry.id === clothingId);
  if (!item) return state;
  const person = state.people.find((entry) => entry.id === item.personId);
  const purchase: Purchase = {
    id: uid(),
    name: person ? `${item.clothingType} for ${person.name}` : item.clothingType,
    category: clothingPurchaseCategory(person?.relationship ?? "", person?.familyGroup ?? "other"),
    quantity: 1,
    recipientId: item.personId,
    recipientName: person?.name ?? "",
    eventId: item.eventId,
    estimatedPrice: item.estimatedPrice,
    actualPrice: item.actualPrice,
    shop: item.shop,
    market: item.shop,
    priority: "medium",
    deadline: item.deliveryDeadline,
    status: item.status,
    notes: item.notes,
    tripId: "",
    clothingId: item.id,
    giftId: "",
    isSample: false,
  };
  return { ...state, purchases: [...state.purchases, purchase] };
}

export function saveGift(state: AppState, gift: Gift): AppState {
  const next = { ...gift, isSample: false };
  const gifts = upsert(state.gifts, next);
  const purchases = state.purchases.map((purchase) =>
    purchase.giftId === next.id
      ? {
          ...purchase,
          name: next.description || purchase.name,
          quantity: next.quantity,
          estimatedPrice: next.estimatedCost,
          actualPrice: next.actualCost,
          status: purchaseStatusFromGift(next.status),
          recipientId: next.recipientId,
          recipientName: next.recipientName,
          isSample: false,
        }
      : purchase,
  );
  return { ...state, gifts, purchases };
}

export function deleteGift(state: AppState, id: string): AppState {
  return {
    ...state,
    gifts: state.gifts.filter((gift) => gift.id !== id),
    purchases: state.purchases.map((item) => (item.giftId === id ? { ...item, giftId: "" } : item)),
  };
}

export function addGiftToShopping(state: AppState, giftId: string): AppState {
  if (state.purchases.some((item) => item.giftId === giftId)) return state;
  const gift = state.gifts.find((entry) => entry.id === giftId);
  if (!gift) return state;
  const category =
    gift.occasion === "Bhaat" ? "Bhaat gifts" : gift.occasion === "Guest return gifts" ? "Guest return gifts" : "Gifts";
  const purchase: Purchase = {
    id: uid(),
    name: gift.description || `Gift for ${gift.recipientName}`,
    category,
    quantity: gift.quantity || 1,
    recipientId: gift.recipientId,
    recipientName: gift.recipientName,
    eventId: gift.occasion === "Bhaat" ? state.events.find((event) => event.name === "Bhaat")?.id ?? "" : "",
    estimatedPrice: gift.estimatedCost,
    actualPrice: gift.actualCost,
    shop: "",
    market: "",
    priority: "medium",
    deadline: "",
    status: purchaseStatusFromGift(gift.status),
    notes: gift.notes,
    tripId: "",
    clothingId: "",
    giftId: gift.id,
    isSample: false,
  };
  return { ...state, purchases: [...state.purchases, purchase] };
}

export function saveGuest(state: AppState, guest: Guest): AppState {
  return { ...state, guests: upsert(state.guests, { ...guest, isSample: false }) };
}

export function deleteGuest(state: AppState, id: string): AppState {
  return { ...state, guests: state.guests.filter((guest) => guest.id !== id) };
}

export function importGuests(state: AppState, guests: Guest[]): AppState {
  return { ...state, guests: [...state.guests, ...guests] };
}

export function saveInvitation(state: AppState, invitation: InvitationPlan): AppState {
  return { ...state, invitation };
}

export function saveReturnGifts(state: AppState, returnGifts: ReturnGiftPlan): AppState {
  return { ...state, returnGifts };
}

export function saveExpense(state: AppState, expense: Expense): AppState {
  return { ...state, expenses: upsert(state.expenses, { ...expense, isSample: false }) };
}

export function deleteExpense(state: AppState, id: string): AppState {
  return { ...state, expenses: state.expenses.filter((expense) => expense.id !== id) };
}

export function saveMedia(state: AppState, item: MediaItem): AppState {
  return { ...state, media: upsert(state.media, { ...item, isSample: false }) };
}

export function deleteMedia(state: AppState, id: string): AppState {
  return { ...state, media: state.media.filter((item) => item.id !== id) };
}

function writeLookProgress(state: AppState, pieceId: string, status: LookStatus, note: string): AppState {
  const progress = state.coupleLooks.progress.filter((item) => item.pieceId !== pieceId);
  const next = status === "needed" && !note.trim() ? progress : [...progress, { pieceId, status, note }];
  return { ...state, coupleLooks: { ...state.coupleLooks, progress: next } };
}

export function setLookStatus(state: AppState, pieceId: string, status: LookStatus): AppState {
  const note = state.coupleLooks.progress.find((item) => item.pieceId === pieceId)?.note ?? "";
  return writeLookProgress(state, pieceId, status, note);
}

export function setLookNote(state: AppState, pieceId: string, note: string): AppState {
  const status = state.coupleLooks.progress.find((item) => item.pieceId === pieceId)?.status ?? "needed";
  return writeLookProgress(state, pieceId, status, note);
}

export function saveCustomLook(state: AppState, piece: CustomLookPiece): AppState {
  const custom = state.coupleLooks.custom.some((item) => item.id === piece.id)
    ? state.coupleLooks.custom.map((item) => (item.id === piece.id ? piece : item))
    : [...state.coupleLooks.custom, piece];
  return { ...state, coupleLooks: { ...state.coupleLooks, custom } };
}

export function deleteCustomLook(state: AppState, id: string): AppState {
  return {
    ...state,
    coupleLooks: {
      ...state.coupleLooks,
      custom: state.coupleLooks.custom.filter((item) => item.id !== id),
      progress: state.coupleLooks.progress.filter((item) => item.pieceId !== id),
    },
  };
}

export function setCeremonyOff(state: AppState, person: LookPerson, ceremony: string, off: boolean): AppState {
  const skippedCeremonies = state.coupleLooks.skippedCeremonies.filter(
    (item) => !(item.person === person && item.ceremony === ceremony),
  );
  return {
    ...state,
    coupleLooks: {
      ...state.coupleLooks,
      skippedCeremonies: off ? [...skippedCeremonies, { person, ceremony }] : skippedCeremonies,
    },
  };
}

export function removeSampleData(state: AppState): AppState {
  const removedTrips = new Set(state.trips.filter((trip) => trip.isSample).map((trip) => trip.id));
  const purchases = state.purchases
    .filter((item) => !item.isSample)
    .map((item) => (removedTrips.has(item.tripId) ? { ...item, tripId: "" } : item));
  const purchaseIds = new Set(purchases.map((item) => item.id));
  const people = state.people.filter((person) => !person.isSample);
  const peopleIds = new Set(people.map((person) => person.id));
  return {
    ...state,
    sampleLoaded: false,
    people,
    events: state.events.filter((item) => !item.isSample),
    tasks: state.tasks.filter((item) => !item.isSample),
    calendarEntries: state.calendarEntries.filter((item) => !item.isSample),
    purchases,
    trips: state.trips
      .filter((trip) => !trip.isSample)
      .map((trip) => ({
        ...trip,
        purchaseIds: trip.purchaseIds.filter((id) => purchaseIds.has(id)),
        memberIds: trip.memberIds.filter((id) => peopleIds.has(id)),
      })),
    clothing: state.clothing.filter((item) => !item.isSample),
    gifts: state.gifts.filter((item) => !item.isSample),
    guests: state.guests.filter((item) => !item.isSample),
    expenses: state.expenses.filter((item) => !item.isSample),
    media: state.media.filter((item) => !item.isSample),
  };
}

export function restoreSampleData(state: AppState): AppState {
  const sample = buildSampleState();
  const merge = <T extends { id: string }>(current: T[], extras: T[]) => {
    const ids = new Set(current.map((item) => item.id));
    return [...current, ...extras.filter((item) => !ids.has(item.id))];
  };
  return {
    ...state,
    sampleLoaded: true,
    settings: state.settings,
    people: merge(state.people, sample.people),
    events: merge(state.events, sample.events),
    tasks: merge(state.tasks, sample.tasks),
    calendarEntries: merge(state.calendarEntries, sample.calendarEntries),
    purchases: merge(state.purchases, sample.purchases),
    trips: merge(state.trips, sample.trips),
    clothing: merge(state.clothing, sample.clothing),
    gifts: merge(state.gifts, sample.gifts),
    guests: merge(state.guests, sample.guests),
    expenses: merge(state.expenses, sample.expenses),
    media: merge(state.media, sample.media),
  };
}
