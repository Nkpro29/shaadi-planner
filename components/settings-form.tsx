"use client";

import { useState, type FormEvent } from "react";
import { AreaField, FormGrid, MoneyField, TextField, DateField } from "@/components/fields";
import { Button, FormError } from "@/components/ui";
import { moneyOrBlank, parseCount, parseMoney } from "@/lib/format";
import type { WeddingSettings } from "@/lib/types";

export function SettingsForm({
  settings,
  onSave,
  compact = false,
}: {
  settings: WeddingSettings;
  onSave: (settings: WeddingSettings) => void;
  compact?: boolean;
}) {
  const [brideName, setBrideName] = useState(settings.brideName);
  const [groomName, setGroomName] = useState(settings.groomName);
  const [weddingDate, setWeddingDate] = useState(settings.weddingDate);
  const [budget, setBudget] = useState(moneyOrBlank(settings.totalBudget));
  const [city, setCity] = useState(settings.city);
  const [marketName, setMarketName] = useState(settings.marketName);
  const [travel, setTravel] = useState(settings.travelMinutes == null ? "" : String(settings.travelMinutes));
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!brideName.trim() || !groomName.trim()) {
      setError("Add the bride's and groom's names.");
      return;
    }
    const totalBudget = parseMoney(budget);
    const travelMinutes = parseCount(travel, null);
    if (!totalBudget.ok) {
      setError("Enter the budget as a number, or leave it blank.");
      return;
    }
    if (!travelMinutes.ok) {
      setError("Enter travel time in minutes, or leave it blank.");
      return;
    }
    setError("");
    onSave({
      brideName: brideName.trim(),
      groomName: groomName.trim(),
      weddingDate,
      totalBudget: totalBudget.value,
      city: city.trim(),
      marketName: marketName.trim(),
      travelMinutes: travelMinutes.value,
      timezone: "Asia/Kolkata",
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormGrid>
        <TextField label="Bride's name" required value={brideName} onChange={setBrideName} />
        <TextField label="Groom's name" required value={groomName} onChange={setGroomName} />
        <DateField label="Wedding date" value={weddingDate} onChange={setWeddingDate} hint="Leave this blank until the date is fixed." />
        <MoneyField label="Total wedding budget" value={budget} onChange={setBudget} hint="Leave blank until you decide the budget." />
        {compact ? null : (
          <>
            <TextField label="City" value={city} onChange={setCity} />
            <TextField label="Usual market" value={marketName} onChange={setMarketName} hint="Optional. Used as a reminder on shopping trips." />
            <TextField
              label="Travel time to the market (minutes)"
              value={travel}
              onChange={setTravel}
              hint="About 30 minutes from home. Change this if the market is different."
            />
          </>
        )}
      </FormGrid>
      {compact ? (
        <AreaField
          label="Usual market"
          value={marketName}
          onChange={setMarketName}
          hint="Optional. Travel time can be edited from Edit wedding details."
        />
      ) : null}
      <FormError message={error} />
      <Button type="submit">Save wedding details</Button>
    </form>
  );
}
