"use client";

import { useState, type FormEvent } from "react";
import { AreaField, FormGrid, OptionField, TextField } from "@/components/fields";
import { Badge, Button, Card, EmptyState, FormActions, FormError, Modal, PageHeader, useConfirm } from "@/components/ui";
import {
  LOOK_CEREMONIES,
  LOOK_STATUSES,
  LOOK_ZONES,
  isCeremonyOff,
  piecesFor,
  progressFor,
  zoneLabel,
  type LookZoneId,
} from "@/lib/looks";
import { uid } from "@/lib/format";
import { deleteCustomLook, saveCustomLook, setCeremonyOff, setLookNote, setLookStatus } from "@/lib/mutate";
import { useReadyPlanner } from "@/lib/store";
import type { LookPerson, LookStatus } from "@/lib/types";

type Filter = "all" | "open" | "bought";

export function CouplePage() {
  const planner = useReadyPlanner();
  const [person, setPerson] = useState<LookPerson>("bride");
  const [ceremony, setCeremony] = useState<string>(LOOK_CEREMONIES[0].id);
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const { ask, dialog } = useConfirm();

  if (!planner) return null;
  const { state, update } = planner;
  const looks = state.coupleLooks;
  const name = person === "bride" ? state.settings.brideName : state.settings.groomName;
  const ceremonyInfo = LOOK_CEREMONIES.find((item) => item.id === ceremony) ?? LOOK_CEREMONIES[0];
  const off = isCeremonyOff(looks, person, ceremony);
  const pieces = piecesFor(person, ceremony, looks.custom);
  const visible = pieces.filter((item) => {
    const status = progressFor(looks, item.id).status;
    if (filter === "bought") return status === "bought";
    if (filter === "open") return status === "needed" || status === "shortlisted";
    return true;
  });
  const tally = tallyPieces(pieces.map((item) => progressFor(looks, item.id).status));
  const zones = LOOK_ZONES.map((zone) => ({
    ...zone,
    items: visible.filter((item) => item.zone === zone.id),
  })).filter((zone) => zone.items.length > 0);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Head to toe"
        title="Bride & Groom"
        subtitle="What each of you needs to shop for every ceremony, from hair and jewellery down to footwear. Family outfits stay on Family & Clothing."
        action={<Button onClick={() => setAdding(true)}>Add a piece</Button>}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <PersonButton
          active={person === "bride"}
          label="Bride"
          name={state.settings.brideName}
          onClick={() => setPerson("bride")}
        />
        <PersonButton
          active={person === "groom"}
          label="Groom"
          name={state.settings.groomName}
          onClick={() => setPerson("groom")}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {LOOK_CEREMONIES.map((item) => {
          const ceremonyOff = isCeremonyOff(looks, person, item.id);
          const count = ceremonyOff
            ? null
            : tallyPieces(piecesFor(person, item.id, looks.custom).map((piece) => progressFor(looks, piece.id).status)).open;
          const active = item.id === ceremony;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCeremony(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-maroon text-ivory" : "border border-line bg-white text-ink"}`}
            >
              {item.label}
              {ceremonyOff ? <span className="ml-2 text-xs font-medium opacity-70">Off</span> : null}
              {!ceremonyOff && count ? <span className={`ml-2 text-xs ${active ? "text-gold-soft" : "text-muted"}`}>{count}</span> : null}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{name}</p>
            <h2 className="mt-1 font-display text-4xl text-maroon-deep">{ceremonyInfo.label}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{ceremonyInfo.note}</p>
          </div>
          <Button variant="secondary" onClick={() => update((current) => setCeremonyOff(current, person, ceremony, !off))}>
            {off ? "Include this ceremony" : "We are not holding this"}
          </Button>
        </div>
        {off ? (
          <p className="mt-4 text-sm leading-6">
            This ceremony is off {name}&apos;s shopping list. Include it again if the plan changes. Pieces you already marked stay as they were.
          </p>
        ) : (
          <>
            <div className="mt-4 h-2 rounded-full bg-gold-soft">
              <div
                className="h-2 rounded-full bg-maroon"
                style={{ width: `${tally.total ? Math.round((tally.settled / tally.total) * 100) : 0}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {tally.bought} bought · {tally.open} still to shop · {tally.skipped} not for {name}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All pieces</FilterButton>
              <FilterButton active={filter === "open"} onClick={() => setFilter("open")}>Still to shop</FilterButton>
              <FilterButton active={filter === "bought"} onClick={() => setFilter("bought")}>Bought</FilterButton>
            </div>
          </>
        )}
      </Card>

      {off ? null : zones.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body={filter === "all" ? "Add a piece if this ceremony needs something that is not on the list." : "No pieces match this filter."}
          action={filter === "all" ? <Button onClick={() => setAdding(true)}>Add a piece</Button> : <Button variant="secondary" onClick={() => setFilter("all")}>Show all pieces</Button>}
        />
      ) : (
        <ol className="space-y-1">
          {zones.map((zone, index) => (
            <li key={zone.id} className="flex gap-3">
              <div className="flex w-8 flex-col items-center">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-maroon-deep text-xs font-bold text-ivory">
                  {index + 1}
                </span>
                <span className="mt-1 w-px flex-1 bg-gold-soft" />
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <h3 className="font-display text-3xl leading-none text-maroon-deep">{zone.label}</h3>
                <div className="mt-3 space-y-3">
                  {zone.items.map((item) => {
                    const progress = progressFor(looks, item.id);
                    return (
                      <article
                        key={item.id}
                        className={`rounded-2xl border px-4 py-3 ${
                          progress.status === "bought"
                            ? "border-[#c5e0cf] bg-[#f4faf6]"
                            : progress.status === "skipped"
                              ? "border-line bg-ivory/80"
                              : "border-line bg-paper"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-ink">{item.name}</h4>
                              {item.custom ? <Badge tone="gold">Added by you</Badge> : null}
                            </div>
                            {item.detail ? <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p> : null}
                          </div>
                          {item.custom ? (
                            <Button
                              variant="danger"
                              onClick={() =>
                                ask(`Remove ${item.name}?`, "It will come off this ceremony list.", () =>
                                  update((current) => deleteCustomLook(current, item.id)),
                                )
                              }
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`Status for ${item.name}`}>
                          {LOOK_STATUSES.map((option) => {
                            const active = progress.status === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => update((current) => setLookStatus(current, item.id, option.value))}
                                className={`min-h-10 rounded-full px-3 text-sm font-semibold ${statusClass(option.value, active)}`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                        <NoteField
                          value={progress.note}
                          onSave={(note) => update((current) => setLookNote(current, item.id, note))}
                        />
                      </article>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {adding ? (
        <AddPieceForm
          person={person}
          personName={name}
          ceremony={ceremony}
          onClose={() => setAdding(false)}
          onSave={(piece) => {
            update((current) => saveCustomLook(current, piece));
            setAdding(false);
          }}
        />
      ) : null}
      {dialog}
    </div>
  );
}

function PersonButton({
  active,
  label,
  name,
  onClick,
}: {
  active: boolean;
  label: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left ${active ? "border-maroon bg-maroon text-ivory" : "border-line bg-paper text-ink"}`}
    >
      <span className={`block text-xs font-bold uppercase tracking-[0.16em] ${active ? "text-gold-soft" : "text-gold"}`}>{label}</span>
      <span className="mt-1 block font-display text-3xl leading-none">{name}</span>
    </button>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-full px-3 text-sm font-semibold ${active ? "bg-ink text-ivory" : "border border-line bg-white text-ink"}`}
    >
      {children}
    </button>
  );
}

function NoteField({ value, onSave }: { value: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setDraft(value);
  }
  return (
    <label className="mt-3 block">
      <span className="sr-only">Note</span>
      <input
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-[#b3a89a] focus:border-maroon focus:ring-2 focus:ring-maroon/15"
        value={draft}
        placeholder="Shop, colour, size, or who is bringing it"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
        }}
      />
    </label>
  );
}

function AddPieceForm({
  person,
  personName,
  ceremony,
  onClose,
  onSave,
}: {
  person: LookPerson;
  personName: string;
  ceremony: string;
  onClose: () => void;
  onSave: (piece: { id: string; person: LookPerson; ceremony: string; zone: string; name: string; detail: string }) => void;
}) {
  const [zone, setZone] = useState<LookZoneId>("outfit");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const ceremonyLabel = LOOK_CEREMONIES.find((item) => item.id === ceremony)?.label ?? ceremony;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name the piece.");
      return;
    }
    onSave({
      id: uid(),
      person,
      ceremony,
      zone,
      name: name.trim(),
      detail: detail.trim(),
    });
  }

  return (
    <Modal title="Add a piece" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm leading-6 text-muted">
          This goes on {personName}&apos;s {ceremonyLabel} list, under {zoneLabel(zone)}.
        </p>
        <FormError message={error} />
        <FormGrid>
          <OptionField label="Where it sits" value={zone} onChange={setZone} options={LOOK_ZONES.map((item) => ({ value: item.id, label: item.label }))} />
          <TextField label="Piece" value={name} onChange={setName} required placeholder="For example, extra dupatta" />
        </FormGrid>
        <AreaField label="What to look for" value={detail} onChange={setDetail} />
        <FormActions onClose={onClose} saveLabel="Add to the list" />
      </form>
    </Modal>
  );
}

function statusClass(status: LookStatus, active: boolean) {
  if (!active) return "border border-line bg-white text-muted hover:border-gold";
  if (status === "bought") return "bg-ok text-ivory";
  if (status === "shortlisted") return "bg-gold text-ivory";
  if (status === "skipped") return "bg-ink/80 text-ivory";
  return "bg-maroon text-ivory";
}

function tallyPieces(statuses: LookStatus[]) {
  let bought = 0;
  let open = 0;
  let skipped = 0;
  for (const status of statuses) {
    if (status === "bought") bought += 1;
    else if (status === "skipped") skipped += 1;
    else open += 1;
  }
  return { bought, open, skipped, settled: bought + skipped, total: statuses.length };
}
