import { labelOf, INVITE_STATUSES, RSVP_STATUSES } from "./constants";
import { uid } from "./format";
import type { Guest, InviteStatus, RsvpStatus, WeddingEvent } from "./types";

function escapeCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function guestsToCsv(guests: Guest[], events: WeddingEvent[]) {
  const headers = [
    "Name",
    "Household",
    "Relationship group",
    "City or country",
    "Family members",
    "Phone",
    "Invitation status",
    "RSVP status",
    "Events",
    "Accommodation",
    "Notes",
  ];
  const lines = guests.map((guest) => {
    const eventNames = guest.eventIds
      .map((id) => events.find((event) => event.id === id)?.name ?? "")
      .filter(Boolean)
      .join("; ");
    return [
      guest.name,
      guest.household,
      guest.relationshipGroup,
      guest.city,
      guest.memberCount,
      guest.phone,
      labelOf(INVITE_STATUSES, guest.invitationStatus),
      labelOf(RSVP_STATUSES, guest.rsvpStatus),
      eventNames,
      guest.accommodation,
      guest.notes,
    ].map(escapeCell).join(",");
  });
  return [headers.join(","), ...lines].join("\n");
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") cell += character;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim()));
}

function statusFromLabel<T extends string>(options: { value: T; label: string }[], raw: string, fallback: T) {
  const text = raw.trim().toLowerCase();
  const match = options.find(
    (option) => option.label.toLowerCase() === text || option.value.toLowerCase() === text,
  );
  return match?.value ?? fallback;
}

export function csvToGuests(text: string, events: WeddingEvent[]) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const nameIndex = indexOf("name");
  if (nameIndex === -1) throw new Error("The CSV needs a Name column.");
  const pick = (row: string[], ...names: string[]) => {
    const index = indexOf(...names);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };
  const guests: Guest[] = [];
  for (const row of rows.slice(1)) {
    const name = (row[nameIndex] ?? "").trim();
    if (!name) continue;
    const members = Number(pick(row, "family members", "members", "number of family members"));
    const eventNames = pick(row, "events", "events invited to")
      .split(";")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    guests.push({
      id: uid(),
      name,
      household: pick(row, "household", "family or household") || name,
      relationshipGroup: pick(row, "relationship group", "group") || "Other",
      city: pick(row, "city or country", "city", "country"),
      memberCount: Number.isInteger(members) && members > 0 ? members : 1,
      phone: pick(row, "phone", "contact", "optional contact details"),
      invitationStatus: statusFromLabel<InviteStatus>(
        INVITE_STATUSES,
        pick(row, "invitation status"),
        "not_sent",
      ),
      rsvpStatus: statusFromLabel<RsvpStatus>(RSVP_STATUSES, pick(row, "rsvp status", "rsvp"), "awaiting"),
      eventIds: events.filter((event) => eventNames.includes(event.name.toLowerCase())).map((event) => event.id),
      accommodation: pick(row, "accommodation", "accommodation requirements"),
      notes: pick(row, "notes"),
      isSample: false,
    });
  }
  return guests;
}
