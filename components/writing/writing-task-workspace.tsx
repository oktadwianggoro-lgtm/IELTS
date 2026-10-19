"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  saveDraftAction,
  startWritingSubmissionAction,
  submitWritingAction,
  updateSelfAssessmentAction,
  type SubmissionDraft,
} from "@/app/(app)/writing-lab/[taskCode]/actions";
import { cn } from "@/lib/utils";
import { countWords as wordCount } from "@/lib/content/word-count";

type VisualData = { type: "table"; headers: string[]; rows: string[][] } | null;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WritingTaskWorkspace({
  taskCode,
  prompt,
  visualData,
  minWords,
  suggestedMinutes,
  initialSubmission,
  revealedSampleAnswer,
  revealedChecklist,
}: {
  taskCode: string;
  prompt: string;
  visualData: VisualData;
  minWords: number;
  suggestedMinutes: number;
  initialSubmission: (SubmissionDraft & { selfAssessment: Record<string, boolean> | null }) | null;
  revealedSampleAnswer: string | null;
  revealedChecklist: string[] | null;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [outline, setOutline] = useState(initialSubmission?.outline ?? "");
  const [body, setBody] = useState(initialSubmission?.body ?? "");
  const [sampleAnswer, setSampleAnswer] = useState(revealedSampleAnswer);
  const [checklist, setChecklist] = useState(revealedChecklist);
  const [selfAssessment, setSelfAssessment] = useState<Record<string, boolean>>(
    initialSubmission?.selfAssessment ?? {},
  );
  const [secondsLeft, setSecondsLeft] = useState(suggestedMinutes * 60);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function scheduleSave(submissionId: string, nextOutline: string, nextBody: string) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaving(true);
      saveDraftAction(submissionId, nextOutline, nextBody).finally(() => setSaving(false));
    }, 1500);
  }

  function handleStart() {
    setStarting(true);
    startWritingSubmissionAction(taskCode)
      .then((result) => {
        if ("error" in result) return;
        setSubmission({ ...result, selfAssessment: null });
        setOutline(result.outline);
        setBody(result.body);
        setSampleAnswer(null);
        setChecklist(null);
        setSelfAssessment({});
        setSecondsLeft(suggestedMinutes * 60);
        setSubmitError(null);
      })
      .finally(() => setStarting(false));
  }

  function handleSubmit() {
    if (!submission) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setSubmitError(null);
    setSubmitting(true);
    submitWritingAction(submission.id, outline, body)
      .then((result) => {
        if ("error" in result) {
          setSubmitError(result.error);
          return;
        }
        setSubmission((prev) => (prev ? { ...prev, status: "SUBMITTED" } : prev));
        setSampleAnswer(result.sampleAnswer);
        setChecklist(result.checklistItems);
      })
      .finally(() => setSubmitting(false));
  }

  function handleAssessmentToggle(key: string, checked: boolean) {
    if (!submission) return;
    const next = { ...selfAssessment, [key]: checked };
    setSelfAssessment(next);
    void updateSelfAssessmentAction(submission.id, next);
  }

  const wc = wordCount(body);
  const underMinimum = wc < minWords;

  if (!submission) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Belum ada draft untuk task ini. Mulai menulis kapan saja — draft tersimpan otomatis.
          </p>
          <Button type="button" onClick={handleStart} disabled={starting}>
            {starting ? "Memulai..." : "Mulai Menulis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Soal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm whitespace-pre-line">
          {prompt}
          {visualData ? (
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr>
                  {visualData.headers.map((h) => (
                    <th key={h} className="border-border border p-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visualData.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-border border p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </CardContent>
      </Card>

      {submission.status === "DRAFT" ? (
        <>
          <div className="border-border bg-card flex items-center justify-between rounded-md border p-2 text-sm">
            <span className="text-muted-foreground">
              {saving ? "Menyimpan draft..." : "Draft tersimpan"}
            </span>
            <span
              className={cn("font-medium tabular-nums", secondsLeft < 300 && "text-destructive")}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Brainstorm / Outline (opsional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={outline}
                onChange={(e) => {
                  setOutline(e.target.value);
                  scheduleSave(submission.id, e.target.value, body);
                }}
                placeholder="Catat ide, poin utama, atau struktur paragraf di sini sebelum menulis..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Jawaban</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  scheduleSave(submission.id, outline, e.target.value);
                }}
                placeholder="Tulis jawaban Anda di sini..."
                rows={16}
                spellCheck
              />
              <p
                className={cn(
                  "text-xs",
                  underMinimum ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {wc} / {minWords} kata{underMinimum ? " — di bawah jumlah kata minimum" : ""}
              </p>
            </CardContent>
          </Card>

          {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}

          <Button type="button" onClick={handleSubmit} disabled={submitting || wc === 0}>
            {submitting ? "Mengirim..." : "Submit"}
          </Button>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jawaban Anda ({wc} kata)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-line">{body}</CardContent>
          </Card>

          {checklist ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Self-Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item, i) => (
                  <label key={i} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selfAssessment[`item-${i}`] ?? false}
                      onCheckedChange={(checked) =>
                        handleAssessmentToggle(`item-${i}`, checked === true)
                      }
                    />
                    <span>{item}</span>
                  </label>
                ))}
                <p className="text-muted-foreground text-xs">
                  Ini refleksi mandiri, bukan penilaian otomatis atau skor resmi IELTS.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {sampleAnswer ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contoh Jawaban</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-line">
                {sampleAnswer}
              </CardContent>
            </Card>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" onClick={handleStart} disabled={starting} variant="outline">
              {starting ? "Memulai..." : "Tulis Lagi"}
            </Button>
            <Button render={<Link href="/writing-lab">Kembali ke Writing Lab</Link>} />
          </div>
        </>
      )}
    </div>
  );
}
