"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button, Modal } from "@/components/ui";
import { NAV_ITEMS } from "@/lib/constants";
import { downloadText, formatIN, todayISO } from "@/lib/format";
import { removeSampleData, restoreSampleData } from "@/lib/mutate";
import { normalize } from "@/lib/normalize";
import { hasSample } from "@/lib/sample";
import { useCurrentUser } from "@/lib/current-user";
import { useStore } from "@/lib/store";

async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.assign("/login");
}

export function Shell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  if (store.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory px-6 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">ShaadiSaathi</p>
          <h1 className="mt-2 font-display text-5xl text-maroon-deep">Opening the planner</h1>
          <p className="mt-3 text-sm text-muted">Times use Asia/Kolkata.</p>
        </div>
      </div>
    );
  }

  if (!store.state || !store.mode) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">ShaadiSaathi</p>
        <h1 className="mt-2 font-display text-5xl text-maroon-deep">The planner could not open</h1>
        <p className="mt-4 text-sm leading-6 text-ink">{store.loadError}</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          If Supabase keys are in .env.local, run the SQL in supabase/schema.sql and check the URL and anon key. Nothing was written during this failed attempt.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => void store.reload()}>Try again</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[270px_1fr]">
      <div className="hidden md:block">
        <SideNav />
      </div>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ivory/95 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="font-display text-2xl leading-none text-maroon-deep">ShaadiSaathi</p>
            <p className="text-xs text-muted">Indian wedding planner</p>
          </div>
          <button type="button" className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold" onClick={() => setMenuOpen(true)}>
            Menu
          </button>
        </header>
        {menuOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[min(100%,300px)] overflow-y-auto">
              <SideNav onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const store = useStore();
  const user = useCurrentUser();
  const state = store.state;
  const [dataOpen, setDataOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  if (!state || !store.mode) return null;
  const sample = hasSample(state);
  const navItems = user.role === "owner" ? [...NAV_ITEMS, { href: "/users", label: "Users" }] : [...NAV_ITEMS];

  return (
    <aside className="flex min-h-full flex-col bg-maroon-deep text-ivory md:sticky md:top-0 md:h-screen">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-soft">ShaadiSaathi</p>
        <p className="mt-1 font-display text-3xl leading-none">Wedding planner</p>
        <p className="mt-3 text-sm text-ivory/75">
          {state.settings.brideName} & {state.settings.groomName}
        </p>
        <p className="text-xs text-ivory/60">
          {state.settings.weddingDate ? formatIN(state.settings.weddingDate) : "Wedding date not set"}
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`block rounded-xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-white/10 text-gold-soft" : "text-ivory/85 hover:bg-white/5"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 px-4 py-4 text-xs leading-5 text-ivory/75">
        <p className="truncate font-semibold text-ivory">{user.name}</p>
        <p className="truncate">{user.email}</p>
        <p>{store.mode === "supabase" ? "Saved to Supabase." : "Saved for everyone who can sign in."}</p>
        {store.saveError ? <p className="text-[#f3c7c2]">{store.saveError}</p> : null}
        {sample ? <p>Sample records are marked Sample.</p> : null}
        <button type="button" className="font-semibold text-gold-soft underline-offset-2 hover:underline" onClick={() => setDataOpen(true)}>
          Backup and sample data
        </button>
        <button
          type="button"
          className="block font-semibold text-gold-soft underline-offset-2 hover:underline disabled:opacity-60"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut();
          }}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      {dataOpen ? (
        <Modal title="Planner data" onClose={() => setDataOpen(false)}>
          <div className="space-y-4 text-sm leading-6 text-ink">
            <p>
              {store.mode === "supabase"
                ? "Changes are saved to your Supabase project. Two people editing at the same time can overwrite each other."
                : "Changes are saved for everyone who can sign in. Two people editing at the same time can overwrite each other. Download a backup before you clear this browser."}
            </p>
            {notice ? <p className="rounded-xl bg-ivory px-3 py-2">{notice}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => downloadText(`shaadisaathi-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), "application/json")}
              >
                Download backup
              </Button>
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold">
                Restore backup
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        store.replaceState(normalize(JSON.parse(String(reader.result))));
                        setNotice("Backup restored.");
                      } catch (error) {
                        setNotice(error instanceof Error ? error.message : "Could not read that file.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
            {sample ? (
              <Button
                variant="danger"
                onClick={() => {
                  store.update(removeSampleData);
                  setNotice("Sample records were removed. Edited records and the wedding details were kept.");
                }}
              >
                Remove sample data
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  store.update(restoreSampleData);
                  setNotice("Sample examples were added back. Your wedding date and budget were not changed.");
                }}
              >
                Show sample examples
              </Button>
            )}
          </div>
        </Modal>
      ) : null}
    </aside>
  );
}
