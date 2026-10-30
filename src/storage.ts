import { STORAGE_KEY } from './constants';
import { createSeed } from './seed';
import type { AppState, InvitationPlan, ReturnGiftPlan, WeddingProfile } from './types';

const defaultInvitation = (): InvitationPlan => ({
  cardDesign: 'Not Started',
  textFinalization: 'Not Started',
  printing: 'Not Started',
  quantity: null,
  distribution: 'Not Started',
  digitalInvitation: 'Not Started',
  invitationVideo: 'Not Started',
  notes: '',
});

const defaultReturn = (): ReturnGiftPlan => ({
  itemName: '',
  expectedQty: 0,
  purchasedQty: 0,
  distributedQty: 0,
  costPerItem: null,
  notes: '',
});

export function normalizeState(value: unknown): AppState | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<AppState>;
  if (!raw.profile || typeof raw.profile !== 'object') return null;
  const profile = raw.profile as WeddingProfile;
  if (typeof profile.brideName !== 'string' || typeof profile.groomName !== 'string') return null;
  const seedProfile = createSeed().profile;
  return {
    profile: {
      brideName: profile.brideName.trim() || seedProfile.brideName,
      groomName: profile.groomName.trim() || seedProfile.groomName,
      weddingDate: typeof profile.weddingDate === 'string' && profile.weddingDate ? profile.weddingDate : null,
      totalBudget: typeof profile.totalBudget === 'number' && profile.totalBudget >= 0 ? profile.totalBudget : null,
    },
    members: Array.isArray(raw.members) ? raw.members : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    events: Array.isArray(raw.events) ? raw.events : [],
    entries: Array.isArray(raw.entries) ? raw.entries.filter((e) => e && e.date) : [],
    purchases: Array.isArray(raw.purchases) ? raw.purchases : [],
    trips: Array.isArray(raw.trips) ? raw.trips : [],
    clothing: Array.isArray(raw.clothing) ? raw.clothing : [],
    gifts: Array.isArray(raw.gifts) ? raw.gifts : [],
    returnGifts: { ...defaultReturn(), ...(raw.returnGifts ?? {}) },
    guests: Array.isArray(raw.guests) ? raw.guests : [],
    invitation: { ...defaultInvitation(), ...(raw.invitation ?? {}) },
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    media: Array.isArray(raw.media) ? raw.media : [],
  };
}

export function loadState(): { state: AppState; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createSeed(), error: null };
    const parsed = normalizeState(JSON.parse(raw));
    if (!parsed) {
      return {
        state: createSeed(),
        error: 'Saved data on this device could not be read, so the sample wedding plan is showing again.',
      };
    }
    return { state: parsed, error: null };
  } catch {
    return {
      state: createSeed(),
      error: 'Saved data on this device could not be read, so the sample wedding plan is showing again.',
    };
  }
}

export function saveState(state: AppState): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch {
    return 'Changes could not be saved on this device. Browser storage may be full.';
  }
}
