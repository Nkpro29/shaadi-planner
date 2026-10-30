"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { AppState } from "./types";
import {
  bindPersistence,
  flushSave,
  loadPlanner,
  rememberMode,
  scheduleSave,
  type StorageMode,
} from "./storage";

interface StoreValue {
  state: AppState | null;
  mode: StorageMode | null;
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  savedAt: string | null;
  reload: () => Promise<void>;
  update: (recipe: (current: AppState) => AppState) => void;
  replaceState: (next: AppState) => void;
  clearSaveError: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [mode, setMode] = useState<StorageMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const stateRef = useRef<AppState | null>(null);

  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await loadPlanner();
      stateRef.current = loaded.state;
      setState(loaded.state);
      setMode(loaded.mode);
      rememberMode(loaded.mode);
      setSavedAt(null);
    } catch (error) {
      stateRef.current = null;
      setState(null);
      setMode(null);
      setLoadError(error instanceof Error ? error.message : "Could not open the planner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bindPersistence({
      onError: (message) => setSaveError(message),
      onSaved: () => {
        setSaveError(null);
        setSavedAt(new Date().toISOString());
      },
    });
    const onHide = () => flushSave();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    void boot();
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [boot]);

  const update = useCallback((recipe: (current: AppState) => AppState) => {
    const current = stateRef.current;
    if (!current) return;
    const next = recipe(current);
    stateRef.current = next;
    setState(next);
    scheduleSave(next);
  }, []);

  const replaceState = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
    scheduleSave(next);
  }, []);

  return (
    <StoreContext.Provider
      value={{
        state,
        mode,
        loading,
        loadError,
        saveError,
        savedAt,
        reload: boot,
        update,
        replaceState,
        clearSaveError: () => setSaveError(null),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("The planner store is not available.");
  return value;
}

export function useReadyPlanner() {
  const store = useStore();
  if (!store.state || !store.mode) return null;
  return { ...store, state: store.state, mode: store.mode };
}
