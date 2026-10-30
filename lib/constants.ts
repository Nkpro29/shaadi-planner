import type {
  AlterationStatus,
  CalendarKind,
  EventStatus,
  FamilyGroup,
  GiftStatus,
  InviteStatus,
  MediaStatus,
  PackagingStatus,
  Priority,
  PurchaseStatus,
  RsvpStatus,
  StepStatus,
  TaskStatus,
} from "./types";

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const TASK_CATEGORIES = [
  "Wedding preparations",
  "Bridal shopping",
  "Groom's family",
  "Bride's family",
  "Bhaat",
  "Gifts",
  "Sangeet",
  "Wedding ceremony",
  "Reception",
  "Invitations",
  "Photography",
  "Videography",
  "Venue and decoration",
  "Catering",
  "Travel",
  "Miscellaneous",
] as const;

export const PURCHASE_CATEGORIES = [
  "Bridal clothes",
  "Groom's clothes",
  "Groom's parents' clothes",
  "Groom's siblings' clothes",
  "Extended family clothing",
  "Bride's family clothing",
  "Jewellery",
  "Footwear",
  "Gifts",
  "Bhaat gifts",
  "Guest return gifts",
  "Wedding cards",
  "Decoration",
  "Ritual supplies",
  "Packaging",
  "Miscellaneous",
] as const;

export const EXPENSE_CATEGORIES = [
  "Clothing",
  "Jewellery",
  "Gifts",
  "Bhaat",
  "Guest return gifts",
  "Venue",
  "Decoration",
  "Catering",
  "Photography",
  "Videography",
  "Invitations",
  "Travel",
  "Accommodation",
  "Miscellaneous",
] as const;

export const GIFT_OCCASIONS = [
  "Bhaat",
  "Maternal relatives",
  "Groom's parents",
  "Groom's siblings",
  "Extended family",
  "Friends",
  "Guest return gifts",
  "Other",
] as const;

export const MEDIA_KINDS = [
  "Wedding invitation cards",
  "Digital invitations",
  "Invitation videos",
  "Sangeet videos",
  "Photography",
  "Videography",
  "Pre-wedding photoshoot",
  "Wedding highlight video",
  "Reception photos",
  "Edited video delivery",
  "Other",
] as const;

export const GUEST_GROUPS = [
  "Bride's family",
  "Groom's family",
  "Maternal family",
  "Friends",
  "Colleagues",
  "Neighbours",
  "Other",
] as const;

export const RELATIONSHIP_SUGGESTIONS = [
  "Bride",
  "Groom",
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Maternal uncle (Mama)",
  "Maternal aunt (Mami)",
  "Paternal uncle",
  "Paternal aunt",
  "Grandmother",
  "Grandfather",
  "Cousin",
  "Sibling",
  "Friend",
];

export const FAMILY_GROUPS: Option<FamilyGroup>[] = [
  { value: "bride", label: "Bride's family" },
  { value: "groom", label: "Groom's family" },
  { value: "other", label: "Other relatives and friends" },
];

export const PRIORITIES: Option<Priority>[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const TASK_STATUSES: Option<TaskStatus>[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "completed", label: "Completed" },
];

export const PURCHASE_STATUSES: Option<PurchaseStatus>[] = [
  { value: "to_buy", label: "To Buy" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "purchased", label: "Purchased" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const GIFT_STATUSES: Option<GiftStatus>[] = [
  { value: "to_decide", label: "To Decide" },
  { value: "to_buy", label: "To Buy" },
  { value: "purchased", label: "Purchased" },
  { value: "packaging_pending", label: "Packaging Pending" },
  { value: "ready", label: "Ready" },
  { value: "given", label: "Given" },
];

export const PACKAGING_STATUSES: Option<PackagingStatus>[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "packed", label: "Packed" },
];

export const EVENT_STATUSES: Option<EventStatus>[] = [
  { value: "planning", label: "Planning" },
  { value: "confirmed", label: "Confirmed" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const RSVP_STATUSES: Option<RsvpStatus>[] = [
  { value: "awaiting", label: "Awaiting reply" },
  { value: "coming", label: "Coming" },
  { value: "not_coming", label: "Cannot attend" },
  { value: "maybe", label: "Maybe" },
];

export const INVITE_STATUSES: Option<InviteStatus>[] = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
];

export const MEDIA_STATUSES: Option<MediaStatus>[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "delivered", label: "Delivered" },
];

export const ALTERATION_STATUSES: Option<AlterationStatus>[] = [
  { value: "not_needed", label: "Not needed" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const STEP_STATUSES: Option<StepStatus>[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const CALENDAR_KINDS: Option<CalendarKind>[] = [
  { value: "appointment", label: "Appointment" },
  { value: "payment", label: "Payment deadline" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
];

export const EVENT_TEMPLATES: { name: string; description: string; checklist: string[] }[] = [
  {
    name: "Engagement",
    description: "Optional engagement gathering. Remove this if you are not holding one.",
    checklist: ["Venue", "Outfits", "Rings or gifts", "Photography", "Guest list", "Catering"],
  },
  {
    name: "Roka",
    description: "Optional roka. Remove this if it is not part of your plans.",
    checklist: ["Family gathering", "Gifts", "Sweets", "Photography"],
  },
  {
    name: "Mehendi",
    description: "Mehendi ceremony. Adjust the checklist to match how your family celebrates.",
    checklist: ["Mehendi artist", "Venue", "Outfits", "Music", "Seating", "Catering"],
  },
  {
    name: "Haldi",
    description: "Haldi ceremony.",
    checklist: ["Haldi and ritual supplies", "Outfits", "Venue", "Towels", "Music", "Photography"],
  },
  {
    name: "Bhaat",
    description: "Bhaat for maternal uncles. Gifts are tracked in Gifts & Bhaat.",
    checklist: ["Confirm Mama list", "Gifts", "Ritual items", "Clothing", "Family coordination"],
  },
  {
    name: "Sangeet",
    description: "Sangeet evening. Performances and music are optional.",
    checklist: ["Venue", "Music", "Performances", "Outfits", "Choreography", "Decoration", "Photography", "Catering"],
  },
  {
    name: "Wedding ceremony",
    description: "The wedding ceremony.",
    checklist: ["Pandit", "Muhurat", "Venue", "Mandap", "Ritual supplies", "Outfits", "Jewellery", "Photography", "Videography", "Catering", "Guest seating"],
  },
  {
    name: "Reception",
    description: "Reception.",
    checklist: ["Venue", "Decoration", "Catering", "Outfits", "Music", "Photography", "Seating plan"],
  },
  {
    name: "Family gathering",
    description: "A family meal or gathering.",
    checklist: ["Venue or home", "Food", "Who to invite"],
  },
  {
    name: "Other ceremony",
    description: "Add the name of the ceremony your family observes.",
    checklist: ["Venue", "People responsible", "What to buy", "Guests"],
  },
];

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/tasks", label: "Tasks & Checklist" },
  { href: "/calendar", label: "Calendar" },
  { href: "/events", label: "Events & Rituals" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/couple", label: "Bride & Groom" },
  { href: "/family", label: "Family & Clothing" },
  { href: "/gifts", label: "Gifts & Bhaat" },
  { href: "/guests", label: "Guests & Invitations" },
  { href: "/budget", label: "Budget & Expenses" },
  { href: "/media", label: "Cards, Photos & Videos" },
] as const;

export function labelOf<T extends string>(options: Option<T>[], value: T | string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function clothingPurchaseCategory(relationship: string, familyGroup: FamilyGroup) {
  const rel = relationship.toLowerCase();
  if (rel.includes("bride")) return "Bridal clothes";
  if (familyGroup === "bride") return "Bride's family clothing";
  if (rel.includes("sibling") || rel.includes("sister") || rel.includes("brother")) {
    return "Groom's siblings' clothes";
  }
  if (rel.includes("mother") || rel.includes("father") || rel.includes("parent")) {
    return "Groom's parents' clothes";
  }
  if (rel.includes("groom")) return "Groom's clothes";
  if (familyGroup === "groom") return "Extended family clothing";
  return "Extended family clothing";
}
