import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalize } from "./normalize";
import { buildSampleState, STORAGE_KEY } from "./sample";
import type { AppState } from "./types";

export type StorageMode = "shared" | "supabase";

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return client;
}

export async function loadPlanner(): Promise<{ state: AppState; mode: StorageMode }> {
  if (supabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase keys are missing.");
    const { data, error } = await supabase.from("planner_state").select("data").eq("id", "default").maybeSingle();
    if (error) {
      throw new Error(
        `${error.message} Create the planner_state table with supabase/schema.sql, then try again.`,
      );
    }
    if (!data?.data) {
      const initial = buildSampleState();
      const inserted = await supabase.from("planner_state").insert({ id: "default", data: initial }).select("data").single();
      if (inserted.error) throw new Error(inserted.error.message);
      return { state: normalize(inserted.data.data), mode: "supabase" };
    }
    return { state: normalize(data.data), mode: "supabase" };
  }

  const response = await fetch("/api/planner", { cache: "no-store" });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("Please sign in.");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Could not open the shared planner.");
  }
  const body = (await response.json()) as { state?: AppState | null };
  if (body.state) {
    const state = normalize(body.state);
    writeLocal(state);
    return { state, mode: "shared" };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const initial = raw ? normalize(JSON.parse(raw)) : buildSampleState();
  const saved = await fetch("/api/planner", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: initial }),
  });
  if (!saved.ok) {
    const failure = (await saved.json().catch(() => null)) as { error?: string } | null;
    throw new Error(failure?.error || "Could not save the planner for everyone who can sign in.");
  }
  writeLocal(initial);
  return { state: initial, mode: "shared" };
}

function writeLocal(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The shared copy is on the server. A full browser cache is only a backup.
  }
}

let latest: AppState | null = null;
let mode: StorageMode = "shared";
let timer = 0;
let writing = false;
let onError: (message: string) => void = () => {};
let onSaved: () => void = () => {};

export function bindPersistence(handlers: { onError: (message: string) => void; onSaved: () => void }) {
  onError = handlers.onError;
  onSaved = handlers.onSaved;
}

export function rememberMode(next: StorageMode) {
  mode = next;
}

async function writeSupabase(state: AppState) {
  const supabase = getSupabase();
  if (!supabase) return;
  writing = true;
  const { error } = await supabase.from("planner_state").upsert({
    id: "default",
    data: state,
    updated_at: new Date().toISOString(),
  });
  writing = false;
  if (error) {
    onError(`Could not save to Supabase: ${error.message}`);
    return;
  }
  onSaved();
  if (latest && latest !== state) void writeSupabase(latest);
}

async function writeShared(state: AppState) {
  writing = true;
  const response = await fetch("/api/planner", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  writing = false;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    onError(body?.error || "Could not save the planner.");
    return;
  }
  writeLocal(state);
  onSaved();
  if (latest && latest !== state) void writeShared(latest);
}

export function scheduleSave(state: AppState) {
  latest = state;
  if (mode === "shared") writeLocal(state);
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (!writing && latest) {
      if (mode === "supabase") void writeSupabase(latest);
      else void writeShared(latest);
    }
  }, 400);
}

export function flushSave() {
  window.clearTimeout(timer);
  if (latest && !writing) {
    if (mode === "supabase") void writeSupabase(latest);
    else void writeShared(latest);
  }
}
