"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function useOpenFromQuery(name: string, open: (value: string) => void, ready = true) {
  const params = useSearchParams();
  const value = params.get(name);
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !value) return;
    const token = `${name}:${value}`;
    if (seen.current === token) return;
    seen.current = token;
    open(value);
  }, [name, open, ready, value]);
}
