export type Id = string;

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Waiting' | 'Completed';
export type PurchaseStatus = 'To Buy' | 'Shortlisted' | 'Purchased' | 'Delivered' | 'Cancelled';
export type GiftStatus = 'To Decide' | 'To Buy' | 'Purchased' | 'Packaging Pending' | 'Ready' | 'Given';
export type EventStatus = 'Planning' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type FamilyGroup = "Bride's family" | "Groom's family" | 'Other';
export type InvitationStatus = 'Not Sent' | 'Draft Ready' | 'Sent' | 'Delivered';
export type RsvpStatus = 'Awaiting' | 'Attending' | 'Not Attending' | 'Maybe';
export type MediaStatus = 'Planning' | 'In Progress' | 'Review' | 'Approved' | 'Delivered';
export type AlterationStatus = 'Not Needed' | 'Pending' | 'In Progress' | 'Done';
export type StepStatus = 'Not Started' | 'In Progress' | 'Done';
export type CalendarKind = 'Appointment' | 'Payment deadline' | 'Note' | 'Other';

export interface WeddingProfile {
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  totalBudget: number | null;
}

export interface FamilyMember {
  id: Id;
  name: string;
  relationship: string;
  group: FamilyGroup;
  phone: string;
  email: string;
  notes: string;
  isDemo: boolean;
}

export interface ChecklistItem {
  id: Id;
  label: string;
  done: boolean;
}

export interface WeddingEvent {
  id: Id;
  name: string;
  date: string | null;
  startTime: string;
  endTime: string;
  venue: string;
  description: string;
  expectedGuests: number | null;
  budget: number | null;
  responsibleId: string | null;
  status: EventStatus;
  checklist: ChecklistItem[];
  vendors: string;
  notes: string;
  isDemo: boolean;
}

export interface Task {
  id: Id;
  title: string;
  description: string;
  category: string;
  assigneeId: string | null;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  estimatedCost: number | null;
  notes: string;
  eventId: string | null;
  isDemo: boolean;
}

export interface CalendarEntry {
  id: Id;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: CalendarKind;
  notes: string;
  isDemo: boolean;
}

export interface Purchase {
  id: Id;
  name: string;
  category: string;
  quantity: number;
  recipient: string;
  eventId: string | null;
  estimatedPrice: number | null;
  actualPrice: number | null;
  shop: string;
  priority: Priority;
  deadline: string | null;
  status: PurchaseStatus;
  notes: string;
  tripId: string | null;
  isDemo: boolean;
}

export interface ShoppingTrip {
  id: Id;
  name: string;
  date: string | null;
  departureTime: string;
  destination: string;
  travelTime: string;
  memberIds: string[];
  shops: string;
  purchaseIds: string[];
  notes: string;
  isDemo: boolean;
}

export interface ClothingItem {
  id: Id;
  personId: string;
  eventId: string | null;
  clothingType: string;
  estimatedPrice: number | null;
  actualPrice: number | null;
  shop: string;
  size: string;
  status: PurchaseStatus;
  fittingDate: string | null;
  alterationStatus: AlterationStatus;
  deliveryDeadline: string | null;
  notes: string;
  isDemo: boolean;
}

export type GiftKind =
  | 'Bhaat'
  | 'Maternal relatives'
  | "Groom's parents"
  | "Groom's siblings"
  | 'Extended family'
  | 'Friends'
  | 'Guest return gifts'
  | 'Other';

export interface Gift {
  id: Id;
  recipient: string;
  memberId: string | null;
  relationship: string;
  kind: GiftKind;
  occasion: string;
  description: string;
  quantity: number;
  estimatedCost: number | null;
  actualCost: number | null;
  status: GiftStatus;
  forFamily: boolean;
  notes: string;
  isDemo: boolean;
}

export interface ReturnGiftPlan {
  itemName: string;
  expectedQty: number;
  purchasedQty: number;
  distributedQty: number;
  costPerItem: number | null;
  notes: string;
}

export interface Guest {
  id: Id;
  name: string;
  household: string;
  relationshipGroup: string;
  city: string;
  memberCount: number;
  phone: string;
  email: string;
  invitationStatus: InvitationStatus;
  rsvpStatus: RsvpStatus;
  eventIds: string[];
  accommodation: string;
  notes: string;
  isDemo: boolean;
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
  id: Id;
  description: string;
  category: string;
  eventId: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  amountPaid: number | null;
  vendor: string;
  paymentDate: string | null;
  notes: string;
  linkedPurchaseId: string | null;
  linkedClothingId: string | null;
  linkedGiftId: string | null;
  isDemo: boolean;
}

export interface MediaItem {
  id: Id;
  name: string;
  eventId: string | null;
  responsibleId: string | null;
  vendor: string;
  deadline: string | null;
  estimatedCost: number | null;
  status: MediaStatus;
  notes: string;
  link: string;
  isDemo: boolean;
}

export interface AppState {
  profile: WeddingProfile;
  members: FamilyMember[];
  tasks: Task[];
  events: WeddingEvent[];
  entries: CalendarEntry[];
  purchases: Purchase[];
  trips: ShoppingTrip[];
  clothing: ClothingItem[];
  gifts: Gift[];
  returnGifts: ReturnGiftPlan;
  guests: Guest[];
  invitation: InvitationPlan;
  expenses: Expense[];
  media: MediaItem[];
}

export type AgendaSource =
  | 'event'
  | 'task'
  | 'trip'
  | 'entry'
  | 'expense'
  | 'clothing-fitting'
  | 'clothing-delivery'
  | 'media'
  | 'purchase';

export interface AgendaItem {
  key: string;
  source: AgendaSource;
  sourceId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  kindLabel: string;
}
