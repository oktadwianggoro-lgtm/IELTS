"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateOverallBand } from "@/lib/scoring/overall-band";

const BAND_OPTIONS = Array.from({ length: 19 }, (_, i) => (i * 0.5).toFixed(1));

const SKILLS = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
] as const;

type SkillKey = (typeof SKILLS)[number]["key"];

/**
 * Pure client-side calculation — `calculateOverallBand()` has no "server
 * only" import, so this doesn't need a round trip. Combines four
 * already-known/estimated per-skill bands using the official ielts.org
 * rounding rule (verified and unit-tested, see docs/SCORING.md) — it does
 * NOT estimate a skill's band from raw answers; the user supplies all
 * four themselves (e.g. from a real test, or their own self-assessment).
 */
export function BandCalculator() {
  const [bands, setBands] = useState<Record<SkillKey, string>>({
    listening: "6.0",
    reading: "6.0",
    writing: "6.0",
    speaking: "6.0",
  });
  const [result, setResult] = useState<number | null>(null);

  function update(key: SkillKey, value: string | null) {
    if (!value) return;
    setBands((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  }

  function handleCalculate() {
    const overall = calculateOverallBand([
      Number(bands.listening),
      Number(bands.reading),
      Number(bands.writing),
      Number(bands.speaking),
    ]);
    setResult(overall);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SKILLS.map((s) => (
          <div key={s.key} className="space-y-1">
            <Label htmlFor={`band-${s.key}`}>{s.label}</Label>
            <Select value={bands[s.key]} onValueChange={(v) => update(s.key, v)}>
              <SelectTrigger id={`band-${s.key}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAND_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button type="button" onClick={handleCalculate}>
        Hitung Overall Band
      </Button>
      {result !== null ? (
        <p className="text-sm">
          Estimasi overall band:{" "}
          <span className="text-lg font-semibold" data-testid="band-calculator-result">
            {result}
          </span>
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Kalkulator ini hanya menerapkan rumus pembulatan resmi IELTS terhadap empat angka band yang
        Anda masukkan sendiri — bukan menilai jawaban Anda. Masukkan band asli dari tes resmi, atau
        estimasi Anda sendiri per skill, untuk melihat kemungkinan overall band.
      </p>
    </div>
  );
}
