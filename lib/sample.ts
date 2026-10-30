import { blankCoupleLooks } from "./looks";
import type {
  AppState,
  ChecklistItem,
  ClothingItem,
  Expense,
  Gift,
  Guest,
  InvitationPlan,
  MediaItem,
  Person,
  Purchase,
  ReturnGiftPlan,
  ShoppingTrip,
  Task,
  WeddingEvent,
  WeddingSettings,
} from "./types";

export const STORAGE_KEY = "shaadisaathi.v1";

export function blankSettings(): WeddingSettings {
  return {
    brideName: "Dripti Kulshresth",
    groomName: "Benjamin",
    weddingDate: "",
    totalBudget: null,
    city: "",
    marketName: "",
    travelMinutes: 30,
    timezone: "Asia/Kolkata",
  };
}

export function blankInvitation(): InvitationPlan {
  return {
    cardDesign: "not_started",
    textFinalization: "not_started",
    printing: "not_started",
    quantity: null,
    distribution: "not_started",
    digitalInvitation: "not_started",
    invitationVideo: "not_started",
    notes: "",
  };
}

export function blankReturnGifts(): ReturnGiftPlan {
  return {
    expectedQuantity: null,
    purchasedQuantity: null,
    distributedQuantity: null,
    costPerItem: null,
    notes: "",
  };
}

function checks(eventId: string, labels: string[]): ChecklistItem[] {
  return labels.map((label, index) => ({
    id: `${eventId}-c${index + 1}`,
    label,
    done: false,
  }));
}

function event(
  partial: Pick<WeddingEvent, "id" | "name" | "description" | "checklist"> &
    Partial<WeddingEvent>,
): WeddingEvent {
  return {
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    expectedGuests: null,
    budget: null,
    responsiblePersonId: "",
    status: "planning",
    vendors: "",
    notes: "Sample ceremony. Add the real date, venue, and budget.",
    isSample: true,
    ...partial,
  };
}

export function buildSampleState(): AppState {
  const people: Person[] = [
    {
      id: "person-dripti",
      name: "Dripti Kulshresth",
      relationship: "Bride",
      familyGroup: "bride",
      phone: "",
      email: "",
      notes: "",
      isSample: false,
    },
    {
      id: "person-benjamin",
      name: "Benjamin",
      relationship: "Groom",
      familyGroup: "groom",
      phone: "",
      email: "",
      notes: "From Germany.",
      isSample: false,
    },
    {
      id: "person-father",
      name: "Dripti's father",
      relationship: "Father",
      familyGroup: "bride",
      phone: "",
      email: "",
      notes: "Sample relative. Replace with the real name.",
      isSample: true,
    },
    {
      id: "person-mother",
      name: "Dripti's mother",
      relationship: "Mother",
      familyGroup: "bride",
      phone: "",
      email: "",
      notes: "Sample relative. Replace with the real name.",
      isSample: true,
    },
    {
      id: "person-mama-1",
      name: "Mama",
      relationship: "Maternal uncle (Mama)",
      familyGroup: "bride",
      phone: "",
      email: "",
      notes: "Sample maternal uncle for Bhaat. Rename him.",
      isSample: true,
    },
    {
      id: "person-mama-2",
      name: "Mama (second)",
      relationship: "Maternal uncle (Mama)",
      familyGroup: "bride",
      phone: "",
      email: "",
      notes: "Sample second maternal uncle. Rename or delete.",
      isSample: true,
    },
    {
      id: "person-g-father",
      name: "Benjamin's father",
      relationship: "Father",
      familyGroup: "groom",
      phone: "",
      email: "",
      notes: "Sample. Replace with his real name.",
      isSample: true,
    },
    {
      id: "person-g-mother",
      name: "Benjamin's mother",
      relationship: "Mother",
      familyGroup: "groom",
      phone: "",
      email: "",
      notes: "Sample. Replace with her real name. She may need different outfits for the wedding and the reception.",
      isSample: true,
    },
    {
      id: "person-g-sibling",
      name: "Benjamin's sibling",
      relationship: "Sibling",
      familyGroup: "groom",
      phone: "",
      email: "",
      notes: "Sample sibling. Rename, or add more siblings if needed.",
      isSample: true,
    },
  ];

  const events: WeddingEvent[] = [
    event({
      id: "event-mehendi",
      name: "Mehendi",
      description: "Mehendi ceremony. The checklist is a suggestion.",
      responsiblePersonId: "person-mother",
      checklist: checks("event-mehendi", ["Mehendi artist", "Venue", "Outfits", "Music", "Seating", "Catering"]),
    }),
    event({
      id: "event-haldi",
      name: "Haldi",
      description: "Haldi ceremony.",
      responsiblePersonId: "person-mother",
      checklist: checks("event-haldi", ["Haldi and ritual supplies", "Outfits", "Venue", "Towels", "Music", "Photography"]),
    }),
    event({
      id: "event-bhaat",
      name: "Bhaat",
      description: "Bhaat for maternal uncles. Track each Mama's gifts in Gifts & Bhaat.",
      responsiblePersonId: "person-father",
      checklist: checks("event-bhaat", ["Confirm Mama list", "Gifts", "Ritual items", "Clothing", "Family coordination"]),
    }),
    event({
      id: "event-sangeet",
      name: "Sangeet",
      description: "Sangeet. Performances are optional.",
      responsiblePersonId: "person-dripti",
      checklist: checks("event-sangeet", [
        "Venue",
        "Music",
        "Performances",
        "Outfits",
        "Choreography",
        "Decoration",
        "Photography",
        "Catering",
      ]),
    }),
    event({
      id: "event-wedding",
      name: "Wedding ceremony",
      description: "Wedding ceremony for Dripti and Benjamin.",
      responsiblePersonId: "person-father",
      checklist: checks("event-wedding", [
        "Pandit",
        "Muhurat",
        "Venue",
        "Mandap",
        "Ritual supplies",
        "Outfits",
        "Jewellery",
        "Photography",
        "Videography",
        "Catering",
        "Guest seating",
      ]),
    }),
    event({
      id: "event-reception",
      name: "Reception",
      description: "Reception.",
      responsiblePersonId: "person-father",
      checklist: checks("event-reception", ["Venue", "Decoration", "Catering", "Outfits", "Music", "Photography", "Seating plan"]),
    }),
  ];

  const tasks: Task[] = [
    task("task-date", "Confirm the wedding date and venue", "Wedding preparations", "person-father", "high", "event-wedding"),
    task("task-lehenga", "Choose Dripti's wedding lehenga", "Bridal shopping", "person-mother", "high", "event-wedding"),
    task("task-groom-family", "Arrange outfits for Benjamin's parents and sibling", "Groom's family", "person-mother", "high", ""),
    task("task-bride-family", "List clothing for the bride's family", "Bride's family", "person-mother", "medium", ""),
    task("task-bhaat", "Decide the Bhaat gift for each Mama", "Bhaat", "person-father", "high", "event-bhaat"),
    task("task-gifts", "Plan gifts for Benjamin's parents and sibling", "Gifts", "person-dripti", "medium", ""),
    task("task-sangeet", "Decide the sangeet venue, music, and whether there will be performances", "Sangeet", "person-dripti", "medium", "event-sangeet"),
    task("task-pandit", "Confirm the pandit and muhurat", "Wedding ceremony", "person-father", "high", "event-wedding"),
    task("task-reception", "Shortlist a reception venue", "Reception", "person-father", "medium", "event-reception"),
    task("task-cards", "Draft the invitation wording", "Invitations", "person-mother", "medium", ""),
    task("task-photo", "Choose a photographer", "Photography", "person-father", "medium", "event-wedding"),
    task("task-video", "Choose a videographer", "Videography", "person-father", "medium", "event-wedding"),
    task("task-decor", "Talk to decoration vendors", "Venue and decoration", "person-mother", "low", "event-wedding"),
    task("task-food", "Discuss the menu and guest count with the caterer", "Catering", "person-father", "medium", "event-wedding"),
    task("task-travel", "Plan travel and stay for Benjamin's family", "Travel", "person-benjamin", "high", ""),
    task("task-misc", "Keep a running list of small miscellaneous buys", "Miscellaneous", "person-mother", "low", ""),
  ];

  const clothing: ClothingItem[] = [
    cloth("cloth-dripti-wedding", "person-dripti", "event-wedding", "Wedding lehenga"),
    cloth("cloth-dripti-sangeet", "person-dripti", "event-sangeet", "Sangeet outfit"),
    cloth("cloth-ben-wedding", "person-benjamin", "event-wedding", "Sherwani"),
    cloth("cloth-gmother-wedding", "person-g-mother", "event-wedding", "Wedding outfit"),
    cloth("cloth-gmother-reception", "person-g-mother", "event-reception", "Reception outfit"),
    cloth("cloth-gfather-wedding", "person-g-father", "event-wedding", "Wedding outfit"),
    cloth("cloth-sibling-wedding", "person-g-sibling", "event-wedding", "Wedding outfit"),
    cloth("cloth-mama-bhaat", "person-mama-1", "event-bhaat", "Bhaat outfit"),
  ];

  const gifts: Gift[] = [
    gift("gift-mama-1", "person-mama-1", "Mama", "Maternal uncle (Mama)", "Bhaat", "Bhaat gift for Mama", false),
    gift("gift-mama-2", "person-mama-2", "Mama (second)", "Maternal uncle (Mama)", "Bhaat", "Bhaat gift for second Mama", false),
    gift("gift-g-parents", "", "Benjamin's parents", "Parents", "Groom's parents", "Gift for Benjamin's parents", true),
    gift("gift-sibling", "person-g-sibling", "Benjamin's sibling", "Sibling", "Groom's siblings", "Gift for Benjamin's sibling", false),
  ];

  const clothTripIds = [
    "buy-lehenga",
    "buy-sherwani",
    "buy-gmother-wedding",
    "buy-gmother-reception",
    "buy-gfather",
    "buy-sibling",
    "buy-sangeet",
    "buy-mama-outfit",
  ];

  const purchases: Purchase[] = [
    buy("buy-lehenga", "Wedding lehenga for Dripti", "Bridal clothes", "person-dripti", "Dripti Kulshresth", "event-wedding", "Cloth market (sample)", "cloth-dripti-wedding", "", "trip-cloth"),
    buy("buy-sherwani", "Sherwani for Benjamin", "Groom's clothes", "person-benjamin", "Benjamin", "event-wedding", "Cloth market (sample)", "cloth-ben-wedding", "", "trip-cloth"),
    buy("buy-gmother-wedding", "Wedding outfit for Benjamin's mother", "Groom's parents' clothes", "person-g-mother", "Benjamin's mother", "event-wedding", "Cloth market (sample)", "cloth-gmother-wedding", "", "trip-cloth"),
    buy("buy-gmother-reception", "Reception outfit for Benjamin's mother", "Groom's parents' clothes", "person-g-mother", "Benjamin's mother", "event-reception", "Cloth market (sample)", "cloth-gmother-reception", "", "trip-cloth"),
    buy("buy-gfather", "Wedding outfit for Benjamin's father", "Groom's parents' clothes", "person-g-father", "Benjamin's father", "event-wedding", "Cloth market (sample)", "cloth-gfather-wedding", "", "trip-cloth"),
    buy("buy-sibling", "Wedding outfit for Benjamin's sibling", "Groom's siblings' clothes", "person-g-sibling", "Benjamin's sibling", "event-wedding", "Cloth market (sample)", "cloth-sibling-wedding", "", "trip-cloth"),
    buy("buy-sangeet", "Sangeet outfit for Dripti", "Bridal clothes", "person-dripti", "Dripti Kulshresth", "event-sangeet", "Cloth market (sample)", "cloth-dripti-sangeet", "", "trip-cloth"),
    buy("buy-mama-outfit", "Bhaat outfit for Mama", "Extended family clothing", "person-mama-1", "Mama", "event-bhaat", "Cloth market (sample)", "cloth-mama-bhaat", "", "trip-cloth"),
    buy("buy-bhaat-1", "Bhaat gift for Mama", "Bhaat gifts", "person-mama-1", "Mama", "event-bhaat", "Gift shop (sample)", "", "gift-mama-1", ""),
    buy("buy-bhaat-2", "Bhaat gift for second Mama", "Bhaat gifts", "person-mama-2", "Mama (second)", "event-bhaat", "Gift shop (sample)", "", "gift-mama-2", ""),
    buy("buy-parents-gift", "Gift for Benjamin's parents", "Gifts", "", "Benjamin's parents", "", "Gift shop (sample)", "", "gift-g-parents", ""),
    buy("buy-sibling-gift", "Gift for Benjamin's sibling", "Gifts", "person-g-sibling", "Benjamin's sibling", "", "Gift shop (sample)", "", "gift-sibling", ""),
    buy("buy-return", "Guest return gifts", "Guest return gifts", "", "Guests", "", "Gift shop (sample)", "", "", ""),
    buy("buy-cards", "Wedding invitation cards", "Wedding cards", "", "", "", "Printer (sample)", "", "", ""),
    buy("buy-ritual", "Mehendi and haldi ritual supplies", "Ritual supplies", "", "", "event-mehendi", "Ritual shop (sample)", "", "", ""),
    buy("buy-pack", "Gift boxes and wrapping", "Packaging", "", "", "event-bhaat", "Gift shop (sample)", "", "", ""),
    buy("buy-decor", "Decoration materials still to choose", "Decoration", "", "", "event-wedding", "Decor shop (sample)", "", "", ""),
  ];

  const trips: ShoppingTrip[] = [
    {
      id: "trip-cloth",
      name: "Cloth market run (sample)",
      date: "",
      departureTime: "",
      destination: "Cloth market (sample)",
      travelMinutes: 30,
      memberIds: [],
      shops: "Cloth market (sample)",
      purchaseIds: clothTripIds,
      notes: "Sample trip that groups the clothing items from one market. Add the date when you want to go. This does not plan a driving route.",
      isSample: true,
    },
  ];

  const guests: Guest[] = [
    {
      id: "guest-home",
      name: "Sample household",
      household: "Sample household",
      relationshipGroup: "Bride's family",
      city: "",
      memberCount: 4,
      phone: "",
      invitationStatus: "not_sent",
      rsvpStatus: "awaiting",
      eventIds: ["event-wedding", "event-reception"],
      accommodation: "",
      notes: "Sample guest record. Replace with a real family.",
      isSample: true,
    },
    {
      id: "guest-germany",
      name: "Benjamin's friends",
      household: "Friends in Germany",
      relationshipGroup: "Friends",
      city: "Germany",
      memberCount: 2,
      phone: "",
      invitationStatus: "not_sent",
      rsvpStatus: "awaiting",
      eventIds: ["event-wedding"],
      accommodation: "Ask if they need a place to stay",
      notes: "Sample guests. Invitations are not sent from this app.",
      isSample: true,
    },
  ];

  const expenses: Expense[] = [
    expense("exp-clothing", "Clothing bills", "Clothing"),
    expense("exp-bhaat", "Bhaat gifts", "Bhaat", "event-bhaat"),
    expense("exp-venue", "Venue booking", "Venue", "event-wedding"),
    expense("exp-food", "Catering", "Catering", "event-wedding"),
    expense("exp-photo", "Photography", "Photography", "event-wedding"),
    expense("exp-cards", "Invitation printing", "Invitations"),
  ];

  const mediaItems: MediaItem[] = [
    mediaItem("media-card", "Wedding invitation cards", "Wedding invitation cards"),
    mediaItem("media-digital", "Digital invitation", "Digital invitations"),
    mediaItem("media-ivideo", "Invitation video", "Invitation videos"),
    mediaItem("media-sangeet", "Sangeet video", "Sangeet videos", "event-sangeet"),
    mediaItem("media-photo", "Wedding photography", "Photography", "event-wedding"),
    mediaItem("media-film", "Wedding videography", "Videography", "event-wedding"),
    mediaItem("media-pre", "Pre-wedding photoshoot", "Pre-wedding photoshoot"),
    mediaItem("media-highlight", "Wedding highlight video", "Wedding highlight video", "event-wedding"),
    mediaItem("media-reception", "Reception photos", "Reception photos", "event-reception"),
    mediaItem("media-edit", "Edited video delivery", "Edited video delivery", "event-wedding"),
  ];

  return {
    version: 1,
    sampleLoaded: true,
    settings: blankSettings(),
    people,
    events,
    tasks,
    calendarEntries: [],
    purchases,
    trips,
    clothing,
    gifts,
    returnGifts: blankReturnGifts(),
    guests,
    invitation: blankInvitation(),
    expenses,
    media: mediaItems,
    coupleLooks: blankCoupleLooks(),
  };
}

function task(
  id: string,
  title: string,
  category: string,
  assigneeId: string,
  priority: Task["priority"],
  eventId: string,
): Task {
  return {
    id,
    title,
    description: "Sample task. It is not started. Edit or delete it.",
    category,
    assigneeId,
    priority,
    status: "not_started",
    deadline: "",
    estimatedCost: null,
    notes: "",
    eventId,
    isSample: true,
  };
}

function cloth(id: string, personId: string, eventId: string, clothingType: string): ClothingItem {
  return {
    id,
    personId,
    eventId,
    clothingType,
    estimatedPrice: null,
    actualPrice: null,
    shop: "Cloth market (sample)",
    size: "",
    status: "to_buy",
    fittingDate: "",
    alterationStatus: "not_needed",
    deliveryDeadline: "",
    notes: "Sample clothing need. Prices are blank until you add them.",
    isSample: true,
  };
}

function gift(
  id: string,
  recipientId: string,
  recipientName: string,
  relationship: string,
  occasion: string,
  description: string,
  forFamily: boolean,
): Gift {
  return {
    id,
    recipientId,
    recipientName,
    relationship,
    occasion,
    description,
    quantity: 1,
    estimatedCost: null,
    actualCost: null,
    status: "to_buy",
    packagingStatus: "not_started",
    forFamily,
    notes: "Sample gift. Change the description, quantity, and budget to match your tradition.",
    isSample: true,
  };
}

function buy(
  id: string,
  name: string,
  category: string,
  recipientId: string,
  recipientName: string,
  eventId: string,
  shop: string,
  clothingId: string,
  giftId: string,
  tripId: string,
): Purchase {
  return {
    id,
    name,
    category,
    quantity: 1,
    recipientId,
    recipientName,
    eventId,
    estimatedPrice: null,
    actualPrice: null,
    shop,
    market: shop,
    priority: "medium",
    deadline: "",
    status: "to_buy",
    notes: "Sample item. Not purchased.",
    tripId,
    clothingId,
    giftId,
    isSample: true,
  };
}

function expense(id: string, description: string, category: string, eventId = ""): Expense {
  return {
    id,
    description,
    category,
    eventId,
    estimatedCost: null,
    actualCost: null,
    amountPaid: null,
    vendor: "",
    paymentDate: "",
    notes: "Sample expense row. Enter amounts when you have a real quote or payment. Nothing has been marked as paid.",
    isSample: true,
  };
}

function mediaItem(id: string, name: string, kind: string, eventId = ""): MediaItem {
  return {
    id,
    name,
    kind,
    eventId,
    responsiblePersonId: "",
    vendor: "",
    deadline: "",
    estimatedCost: null,
    status: "planning",
    notes: "Sample creative item. It is still in planning.",
    link: "",
    isSample: true,
  };
}

export function hasSample(state: AppState) {
  const lists = [
    state.people,
    state.events,
    state.tasks,
    state.calendarEntries,
    state.purchases,
    state.trips,
    state.clothing,
    state.gifts,
    state.guests,
    state.expenses,
    state.media,
  ];
  return lists.some((list) => list.some((item) => item.isSample));
}
