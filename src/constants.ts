import type {
  AlterationStatus,
  CalendarKind,
  EventStatus,
  FamilyGroup,
  GiftKind,
  GiftStatus,
  InvitationStatus,
  MediaStatus,
  Priority,
  PurchaseStatus,
  RsvpStatus,
  StepStatus,
  TaskStatus,
} from './types';

export const TASK_CATEGORIES = [
  'Wedding preparations',
  'Bridal shopping',
  "Groom's family",
  "Bride's family",
  'Bhaat',
  'Gifts',
  'Sangeet',
  'Wedding ceremony',
  'Reception',
  'Invitations',
  'Photography',
  'Videography',
  'Venue and decoration',
  'Catering',
  'Travel',
  'Miscellaneous',
] as const;

export const SHOPPING_CATEGORIES = [
  'Bridal clothes',
  "Groom's clothes",
  "Groom's parents' clothes",
  "Groom's siblings' clothes",
  'Extended family clothing',
  "Bride's family clothing",
  'Jewellery',
  'Footwear',
  'Gifts',
  'Bhaat gifts',
  'Guest return gifts',
  'Wedding cards',
  'Decoration',
  'Ritual supplies',
  'Packaging',
  'Miscellaneous',
] as const;

export const EXPENSE_CATEGORIES = [
  'Clothing',
  'Jewellery',
  'Gifts',
  'Bhaat',
  'Guest return gifts',
  'Venue',
  'Decoration',
  'Catering',
  'Photography',
  'Videography',
  'Invitations',
  'Travel',
  'Accommodation',
  'Miscellaneous',
] as const;

export const GIFT_KINDS: GiftKind[] = [
  'Bhaat',
  'Maternal relatives',
  "Groom's parents",
  "Groom's siblings",
  'Extended family',
  'Friends',
  'Guest return gifts',
  'Other',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
export const TASK_STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Waiting', 'Completed'];
export const PURCHASE_STATUSES: PurchaseStatus[] = [
  'To Buy',
  'Shortlisted',
  'Purchased',
  'Delivered',
  'Cancelled',
];
export const GIFT_STATUSES: GiftStatus[] = [
  'To Decide',
  'To Buy',
  'Purchased',
  'Packaging Pending',
  'Ready',
  'Given',
];
export const EVENT_STATUSES: EventStatus[] = [
  'Planning',
  'Confirmed',
  'In Progress',
  'Completed',
  'Cancelled',
];
export const FAMILY_GROUPS: FamilyGroup[] = ["Bride's family", "Groom's family", 'Other'];
export const INVITATION_STATUSES: InvitationStatus[] = ['Not Sent', 'Draft Ready', 'Sent', 'Delivered'];
export const RSVP_STATUSES: RsvpStatus[] = ['Awaiting', 'Attending', 'Not Attending', 'Maybe'];
export const MEDIA_STATUSES: MediaStatus[] = [
  'Planning',
  'In Progress',
  'Review',
  'Approved',
  'Delivered',
];
export const ALTERATION_STATUSES: AlterationStatus[] = ['Not Needed', 'Pending', 'In Progress', 'Done'];
export const STEP_STATUSES: StepStatus[] = ['Not Started', 'In Progress', 'Done'];
export const CALENDAR_KINDS: CalendarKind[] = ['Appointment', 'Payment deadline', 'Note', 'Other'];

export const EVENT_TEMPLATES: { name: string; description: string; checklist: string[] }[] = [
  {
    name: 'Engagement',
    description: 'Optional. Keep this only if your families are holding an engagement.',
    checklist: ['Venue or home', 'Families confirmed', 'Outfits', 'Photography'],
  },
  {
    name: 'Roka',
    description: 'Optional. A family gathering to mark the alliance.',
    checklist: ['Gifts', 'Family gathering', 'Outfits', 'Sweets'],
  },
  {
    name: 'Mehendi',
    description: 'Mehendi for the bride and family.',
    checklist: ['Mehendi artist', 'Venue or home setup', 'Outfits', 'Music', 'Refreshments'],
  },
  {
    name: 'Haldi',
    description: 'Haldi ceremony.',
    checklist: ['Haldi and ritual supplies', 'Outfits', 'Seating', 'Photography'],
  },
  {
    name: 'Bhaat',
    description: 'Bhaat and gifts for maternal uncles. Adjust this to your family tradition.',
    checklist: ['Mama list confirmed', 'Gifts for Mama', 'Ritual items', 'Meal'],
  },
  {
    name: 'Sangeet',
    description: 'Music, performances, and a family evening. These items are suggestions.',
    checklist: [
      'Venue',
      'Music',
      'Performances',
      'Outfits',
      'Choreography',
      'Decoration',
      'Photography',
      'Catering',
    ],
  },
  {
    name: 'Wedding ceremony',
    description: 'The wedding ritual.',
    checklist: [
      'Pandit',
      'Mandap',
      'Ritual samagri',
      'Outfits',
      'Jewellery',
      'Photography',
      'Videography',
      'Catering',
      'Guest seating',
    ],
  },
  {
    name: 'Reception',
    description: 'Reception for guests.',
    checklist: ['Venue', 'Stage', 'Catering', 'Outfits', 'Music', 'Photography', 'Return gifts'],
  },
  {
    name: 'Family gathering',
    description: 'A smaller family meal or welcome.',
    checklist: ['Place', 'Menu', 'Who is invited'],
  },
];

export const MEDIA_STARTERS = [
  'Wedding invitation cards',
  'Digital invitation',
  'Invitation video',
  'Sangeet videos',
  'Photography',
  'Videography',
  'Pre-wedding photoshoot',
  'Wedding highlight video',
  'Reception photos',
  'Edited video delivery',
];

export const STORAGE_KEY = 'shaadisaathi.v1';
export const TIMEZONE = 'Asia/Kolkata';
