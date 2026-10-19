"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMockTestAction } from "@/app/(admin)/admin/test-builder/actions";

const EXAM_TYPES = ["ACADEMIC", "GENERAL_TRAINING"] as const;
const KINDS = ["SECTION_TEST", "MINI_MOCK", "FULL_MOCK"] as const;
// Test builder only supports composing sections from existing Listening/
// Reading passages for now — Writing/Speaking have no "section" concept
// (see D-038) and other skills (Grammar etc.) aren't exam sections.
const SKILLS = ["LISTENING", "READING"] as const;

export function CreateMockTestForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    mockTestCode: "",
    mockTestTitle: "",
    blueprintCode: "",
    blueprintTitle: "",
    examType: "ACADEMIC" as (typeof EXAM_TYPES)[number],
    kind: "SECTION_TEST" as (typeof KINDS)[number],
    skill: "READING" as (typeof SKILLS)[number],
    description: "",
    totalMinutes: 20,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setSubmitting(true);
    setError(null);
    createMockTestAction(form)
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
          return;
        }
        router.push(`/admin/test-builder/${result.code}`);
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <Label htmlFor="mockTestCode">Kode Mock Test</Label>
        <Input
          id="mockTestCode"
          value={form.mockTestCode}
          onChange={(e) => update("mockTestCode", e.target.value.toUpperCase())}
          placeholder="MOCKTEST-READING-ACADEMIC-002"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="mockTestTitle">Judul Mock Test</Label>
        <Input
          id="mockTestTitle"
          value={form.mockTestTitle}
          onChange={(e) => update("mockTestTitle", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="blueprintCode">Kode Blueprint</Label>
        <Input
          id="blueprintCode"
          value={form.blueprintCode}
          onChange={(e) => update("blueprintCode", e.target.value.toUpperCase())}
          placeholder="BLUEPRINT-READING-ACADEMIC-SECTION-002"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="blueprintTitle">Judul Blueprint</Label>
        <Input
          id="blueprintTitle"
          value={form.blueprintTitle}
          onChange={(e) => update("blueprintTitle", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Exam Type</Label>
          <Select value={form.examType} onValueChange={(v) => v && update("examType", v as never)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Kind</Label>
          <Select value={form.kind} onValueChange={(v) => v && update("kind", v as never)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Skill</Label>
          <Select value={form.skill} onValueChange={(v) => v && update("skill", v as never)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILLS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="totalMinutes">Durasi (menit)</Label>
        <Input
          id="totalMinutes"
          type="number"
          min={1}
          value={form.totalMinutes}
          onChange={(e) => update("totalMinutes", Number(e.target.value))}
          className="w-32"
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Membuat..." : "Buat Mock Test"}
      </Button>
    </div>
  );
}
