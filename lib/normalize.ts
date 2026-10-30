import { normalizeCoupleLooks } from "./looks";
import { blankInvitation, blankReturnGifts, blankSettings } from "./sample";
import type { AppState } from "./types";

function asRecords(value: unknown): Array<Record<string, unknown> & { id: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> & { id: string } => {
    return Boolean(item) && typeof item === "object" && "id" in item;
  });
}

export function normalize(input: unknown): AppState {
  if (!input || typeof input !== "object") {
    throw new Error("That file is not a ShaadiSaathi backup.");
  }
  const raw = input as Partial<AppState>;
  if (!raw.settings || typeof raw.settings !== "object") {
    throw new Error("Saved data is missing the wedding details.");
  }
  return {
    version: 1,
    sampleLoaded: Boolean(raw.sampleLoaded),
    settings: { ...blankSettings(), ...raw.settings, timezone: "Asia/Kolkata" },
    people: asRecords(raw.people) as unknown as AppState["people"],
    events: asRecords(raw.events).map((event) => ({
      ...event,
      checklist: Array.isArray(event.checklist) ? event.checklist : [],
    })) as unknown as AppState["events"],
    tasks: asRecords(raw.tasks) as unknown as AppState["tasks"],
    calendarEntries: asRecords(raw.calendarEntries) as unknown as AppState["calendarEntries"],
    purchases: asRecords(raw.purchases) as unknown as AppState["purchases"],
    trips: asRecords(raw.trips).map((trip) => ({
      ...trip,
      memberIds: Array.isArray(trip.memberIds) ? trip.memberIds : [],
      purchaseIds: Array.isArray(trip.purchaseIds) ? trip.purchaseIds : [],
    })) as unknown as AppState["trips"],
    clothing: asRecords(raw.clothing) as unknown as AppState["clothing"],
    gifts: asRecords(raw.gifts) as unknown as AppState["gifts"],
    returnGifts: { ...blankReturnGifts(), ...(raw.returnGifts ?? {}) },
    guests: asRecords(raw.guests).map((guest) => ({
      ...guest,
      eventIds: Array.isArray(guest.eventIds) ? guest.eventIds : [],
      memberCount: typeof guest.memberCount === "number" && guest.memberCount > 0 ? guest.memberCount : 1,
    })) as unknown as AppState["guests"],
    invitation: { ...blankInvitation(), ...(raw.invitation ?? {}) },
    expenses: asRecords(raw.expenses) as unknown as AppState["expenses"],
    media: asRecords(raw.media) as unknown as AppState["media"],
    coupleLooks: normalizeCoupleLooks(raw.coupleLooks),
  };
}
