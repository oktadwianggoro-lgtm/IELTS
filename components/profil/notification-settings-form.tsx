"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateNotificationSettingsAction,
  type NotificationSettingsInput,
} from "@/app/(app)/profil/actions";

export function NotificationSettingsForm({ initial }: { initial: NotificationSettingsInput }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof NotificationSettingsInput>(
    key: K,
    value: NotificationSettingsInput[K],
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    updateNotificationSettingsAction(settings)
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setMessage("Preferensi tersimpan.");
      })
      .finally(() => setSaving(false));
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="reminderEnabled">Pengingat belajar harian</Label>
          <p className="text-muted-foreground text-xs">
            Email pengingat dikirim sekali sehari saat Anda membuka dashboard.
          </p>
        </div>
        <Switch
          id="reminderEnabled"
          checked={settings.reminderEnabled}
          onCheckedChange={(checked) => update("reminderEnabled", checked === true)}
        />
      </div>

      {settings.reminderEnabled ? (
        <div className="flex items-center justify-between gap-2 pl-4">
          <Label htmlFor="reminderTime">Jam pengingat (24 jam)</Label>
          <Input
            id="reminderTime"
            type="time"
            className="w-32"
            value={settings.reminderTime ?? ""}
            onChange={(e) => update("reminderTime", e.target.value || null)}
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="reviewDueReminderEnabled">Pengingat review Buku Kesalahan</Label>
          <p className="text-muted-foreground text-xs">
            Banner di dashboard saat ada soal yang siap direview.
          </p>
        </div>
        <Switch
          id="reviewDueReminderEnabled"
          checked={settings.reviewDueReminderEnabled}
          onCheckedChange={(checked) => update("reviewDueReminderEnabled", checked === true)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="streakRiskReminderEnabled">Pengingat streak akan putus</Label>
          <p className="text-muted-foreground text-xs">
            Banner di dashboard saat streak Anda berisiko putus hari ini.
          </p>
        </div>
        <Switch
          id="streakRiskReminderEnabled"
          checked={settings.streakRiskReminderEnabled}
          onCheckedChange={(checked) => update("streakRiskReminderEnabled", checked === true)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="leaderboardOptIn">Ikut leaderboard</Label>
          <p className="text-muted-foreground text-xs">
            Nama samaran Anda (bukan nama asli/email) tampil di leaderboard XP.
          </p>
        </div>
        <Switch
          id="leaderboardOptIn"
          checked={settings.leaderboardOptIn}
          onCheckedChange={(checked) => update("leaderboardOptIn", checked === true)}
        />
      </div>

      {settings.leaderboardOptIn ? (
        <div className="flex items-center justify-between gap-2 pl-4">
          <Label htmlFor="leaderboardAlias">Nama samaran</Label>
          <Input
            id="leaderboardAlias"
            className="w-40"
            value={settings.leaderboardAlias ?? ""}
            onChange={(e) => update("leaderboardAlias", e.target.value)}
            placeholder="mis. Elang Biru"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="analyticsOptOut">Analitik penggunaan</Label>
          <p className="text-muted-foreground text-xs">
            Kunjungan halaman dicatat anonim untuk perbaikan aplikasi (lihat Kebijakan Privasi).
            Matikan untuk berhenti sepenuhnya.
          </p>
        </div>
        <Switch
          id="analyticsOptOut"
          checked={!settings.analyticsOptOut}
          onCheckedChange={(checked) => update("analyticsOptOut", checked !== true)}
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {message ? <p className="text-success text-sm">{message}</p> : null}

      <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Preferensi"}
      </Button>
    </div>
  );
}
