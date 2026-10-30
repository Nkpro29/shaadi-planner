"use client";

import { createContext, useContext } from "react";
import type { PublicUser } from "@/lib/auth/constants";

const CurrentUserContext = createContext<PublicUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("The signed-in user is not available.");
  return user;
}
