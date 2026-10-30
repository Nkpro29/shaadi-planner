export type Priority = "low" | "medium" | "high";

export type TaskStatus = "not_started" | "in_progress" | "waiting" | "completed";

export type PurchaseStatus = "to_buy" | "shortlisted" | "purchased" | "delivered" | "cancelled";

export type GiftStatus =
  | "to_decide"
  | "to_buy"
  | "purchased"
  | "packaging_pending"
  | "ready"
  | "given";

export type PackagingStatus = "not_started" | "in_progress" | "packed";

export type EventStatus = "planning" | "confirmed" | "done" | "cancelled";

export type RsvpStatus = "awaiting" | "coming" | "not_coming" | "maybe";

export type InviteStatus = "not_sent" | "sent" | "delivered";

export type MediaStatus = "planning" | "in_progress" | "review" | "approved" | "delivered";

export type AlterationStatus = "not_needed" | "pending" | "in_progress" | "done";

export type FamilyGroup = "bride" | "groom" | "other";

export type StepStatus = "not_started" | "in_progress" | "done";

export type CalendarKind = "appointment" | "payment" | "shopping" | "other";

export type AgendaSource =
  | "event"
  | "task"
  | "trip"
  | "entry"
  | "payment"
  | "fitting"
  | "clothing"
  | "purchase";

export interface WeddingSettings {
  brideName: string;
  groomName: string;
  weddingDate: string;
  totalBudget: number | null;
  city: string;
  marketName: string;
  travelMinutes: number | null;
  timezone: "Asia/Kolkata";
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  familyGroup: FamilyGroup;
  phone: string;
  email: string;
  notes: string;
  isSample: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  expectedGuests: number | null;
  budget: number | null;
  responsiblePersonId: string;
  status: EventStatus;
  vendors: string;
  notes: string;
  checklist: ChecklistItem[];
  isSample: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  assigneeId: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  estimatedCost: number | null;
  notes: string;
  eventId: string;
  isSample: boolean;
}

export interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: CalendarKind;
  notes: string;
  relatedEventId: string;
  isSample: boolean;
}

export interface Purchase {
  id: string;
  name: string;
  category: string;
  quantity: number;
  recipientId: string;
  recipientName: string;
  eventId: string;
  estimatedPrice: number | null;
  actualPrice: number | null;
  shop: string;
  market: string;
  priority: Priority;
  deadline: string;
  status: PurchaseStatus;
  notes: string;
  tripId: string;
  clothingId: string;
  giftId: string;
  isSample: boolean;
}

export interface ShoppingTrip {
  id: string;
  name: string;
  date: string;
  departureTime: string;
  destination: string;
  travelMinutes: number | null;
  memberIds: string[];
  shops: string;
  purchaseIds: string[];
  notes: string;
  isSample: boolean;
}

export interface ClothingItem {
  id: string;
  personId: string;
  eventId: string;
  clothingType: string;
  estimatedPrice: number | null;
  actualPrice: number | null;
  shop: string;
  size: string;
  status: PurchaseStatus;
  fittingDate: string;
  alterationStatus: AlterationStatus;
  deliveryDeadline: string;
  notes: string;
  isSample: boolean;
}

export interface Gift {
  id: string;
  recipientName: string;
  recipientId: string;
  relationship: string;
  occasion: string;
  description: string;
  quantity: number;
  estimatedCost: number | null;
  actualCost: number | null;
  status: GiftStatus;
  packagingStatus: PackagingStatus;
  forFamily: boolean;
  notes: string;
  isSample: boolean;
}

export interface ReturnGiftPlan {
  expectedQuantity: number | null;
  purchasedQuantity: number | null;
  distributedQuantity: number | null;
  costPerItem: number | null;
  notes: string;
}

export interface Guest {
  id: string;
  name: string;
  household: string;
  relationshipGroup: string;
  city: string;
  memberCount: number;
  phone: string;
  invitationStatus: InviteStatus;
  rsvpStatus: RsvpStatus;
  eventIds: string[];
  accommodation: string;
  notes: string;
  isSample: boolean;
}

export interface InvitationPlan {
  cardDesign: StepStatus;
  textFinalization: StepStatus;
  printing: StepStatus;
  quantity: number | null;
  distribution: StepStatus;
  digitalInvitation: StepStatus;
  invitationVideo: StepStatus;
  notes: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  eventId: string;
  estimatedCost: number | null;
  actualCost: number | null;
  amountPaid: number | null;
  vendor: string;
  paymentDate: string;
  notes: string;
  isSample: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  kind: string;
  eventId: string;
  responsiblePersonId: string;
  vendor: string;
  deadline: string;
  estimatedCost: number | null;
  status: MediaStatus;
  notes: string;
  link: string;
  isSample: boolean;
}

export type LookPerson = "bride" | "groom";

export type LookStatus = "needed" | "shortlisted" | "bought" | "skipped";

export interface LookProgress {
  pieceId: string;
  status: LookStatus;
  note: string;
}

export interface CustomLookPiece {
  id: string;
  person: LookPerson;
  ceremony: string;
  zone: string;
  name: string;
  detail: string;
}

export interface CoupleLooks {
  progress: LookProgress[];
  custom: CustomLookPiece[];
  skippedCeremonies: { person: LookPerson; ceremony: string }[];
}

export interface AppState {
  version: 1;
  sampleLoaded: boolean;
  settings: WeddingSettings;
  people: Person[];
  events: WeddingEvent[];
  tasks: Task[];
  calendarEntries: CalendarEntry[];
  purchases: Purchase[];
  trips: ShoppingTrip[];
  clothing: ClothingItem[];
  gifts: Gift[];
  returnGifts: ReturnGiftPlan;
  guests: Guest[];
  invitation: InvitationPlan;
  expenses: Expense[];
  media: MediaItem[];
  coupleLooks: CoupleLooks;
}

export interface AgendaItem {
  key: string;
  source: AgendaSource;
  sourceId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  meta: string;
  open: boolean;
}
