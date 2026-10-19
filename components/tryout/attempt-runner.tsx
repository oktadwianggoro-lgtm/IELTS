"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import {
  getAttemptStateAction,
  saveAnswerAction,
  startOrResumeAttemptAction,
  submitAttemptAction,
  toggleFlagAction,
  type AttemptResult,
  type AttemptState,
} from "@/app/(app)/tryout/[mockTestCode]/actions";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/content/word-count";

export type AttemptQuestionData = QuizQuestionPublic & { wordLimit: number | null };
export type AttemptSectionData = {
  order: number;
  skill: "LISTENING" | "READING";
  title: string;
  audioUrl: string | null;
  paragraphs: { label: string; text: string }[] | null;
  questions: AttemptQuestionData[];
};

type Phase = "loading" | "not-started" | "in-progress" | "completed";

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function toRawAnswer(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

export function AttemptRunner({
  mockTestCode,
  sections,
  latestAttemptId,
}: {
  mockTestCode: string;
  sections: AttemptSectionData[];
  latestAttemptId: string | null;
}) {
  const [phase, setPhase] = useState<Phase>(latestAttemptId ? "loading" : "not-started");
  const [attemptId, setAttemptId] = useState<string | null>(latestAttemptId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const autoSubmitGuardRef = useRef(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allQuestions = sections.flatMap((s) => s.questions);

  function applyState(state: AttemptState) {
    setAttemptId(state.id);
    setResult(state.result);
    if (state.status === "IN_PROGRESS") {
      const raw: Record<string, string> = {};
      for (const [code, v] of Object.entries(state.answers)) raw[code] = toRawAnswer(v);
      setAnswers(raw);
      setFlagged(new Set(state.flaggedQuestionCodes));
      deadlineRef.current = new Date(state.deadlineAt).getTime();
      autoSubmitGuardRef.current = false;
      setPhase("in-progress");
    } else {
      setPhase("completed");
    }
  }

  useEffect(() => {
    if (!latestAttemptId) return;
    getAttemptStateAction(latestAttemptId).then((res) => {
      if ("error" in res) {
        setPhase("not-started");
        return;
      }
      applyState(res);
    });
    // Only ever runs for the attempt id this component mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "in-progress") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    function tick() {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !autoSubmitGuardRef.current) {
        autoSubmitGuardRef.current = true;
        void handleSubmit();
      }
    }
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // handleSubmit is stable enough for this purpose (closes over attemptId
    // via state, re-created each render, but the interval is torn down and
    // recreated whenever `phase` changes anyway).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    const timeouts = saveTimeoutsRef.current;
    return () => {
      for (const t of Object.values(timeouts)) clearTimeout(t);
    };
  }, []);

  function handleStart() {
    setStarting(true);
    setError(null);
    startOrResumeAttemptAction(mockTestCode)
      .then((res) => {
        if ("error" in res) {
          setError(res.error);
          return;
        }
        applyState(res);
      })
      .finally(() => setStarting(false));
  }

  function handleAnswerChange(question: AttemptQuestionData, raw: string) {
    setAnswers((prev) => ({ ...prev, [question.code]: raw }));
    if (!attemptId) return;
    if (saveTimeoutsRef.current[question.code]) {
      clearTimeout(saveTimeoutsRef.current[question.code]);
    }
    saveTimeoutsRef.current[question.code] = setTimeout(() => {
      const value = toSubmittedValue(question, raw);
      saveAnswerAction(attemptId, question.code, value).then((res) => {
        if ("ok" in res && res.autoSubmitted) {
          void refreshAfterAutoSubmit();
        }
      });
    }, 800);
  }

  function refreshAfterAutoSubmit() {
    if (!attemptId) return;
    getAttemptStateAction(attemptId).then((res) => {
      if (!("error" in res)) applyState(res);
    });
  }

  function handleToggleFlag(code: string) {
    if (!attemptId) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    void toggleFlagAction(attemptId, code);
  }

  function handleSubmit() {
    if (!attemptId || submitting) return Promise.resolve();
    setSubmitting(true);
    return submitAttemptAction(attemptId)
      .then((res) => {
        if ("error" in res) {
          setError(res.error);
          return;
        }
        applyState(res);
      })
      .finally(() => setSubmitting(false));
  }

  function scrollToQuestion(code: string) {
    questionRefs.current[code]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (phase === "loading") {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-center text-sm">
          Memuat attempt...
        </CardContent>
      </Card>
    );
  }

  if (phase === "not-started") {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Mode ujian: timer berjalan terus tanpa jeda, auto-submit saat waktu habis, dan jawaban
            tidak bisa diperiksa satu per satu sebelum selesai.
          </p>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="button" onClick={handleStart} disabled={starting}>
            {starting ? "Memulai..." : "Mulai Tryout"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "completed" && result) {
    return <AttemptResultView result={result} onRetry={handleStart} starting={starting} />;
  }

  const answeredCount = allQuestions.filter(
    (q) => (answers[q.code] ?? "").trim().length > 0,
  ).length;

  return (
    <div className="space-y-4">
      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
        <span className="text-muted-foreground text-sm">
          {answeredCount} / {allQuestions.length} terjawab
        </span>
        <div className="flex flex-wrap gap-1">
          {allQuestions.map((q, i) => {
            const answeredThis = (answers[q.code] ?? "").trim().length > 0;
            const isFlagged = flagged.has(q.code);
            return (
              <button
                key={q.code}
                type="button"
                onClick={() => scrollToQuestion(q.code)}
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded border text-xs",
                  answeredThis ? "border-brand-navy bg-brand-navy/10" : "border-border",
                  isFlagged && "border-brand-amber",
                )}
                aria-label={`Ke soal ${i + 1}${isFlagged ? " (ditandai)" : ""}`}
              >
                {i + 1}
                {isFlagged ? (
                  <Flag className="text-brand-amber absolute -top-1 -right-1 h-3 w-3" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            secondsLeft !== null && secondsLeft < 120 && "text-destructive",
          )}
        >
          {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
        </span>
      </div>

      {sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <div key={section.order} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {section.audioUrl ? (
                  <audio controls src={section.audioUrl} className="w-full" />
                ) : null}
                {section.paragraphs
                  ? section.paragraphs.map((p) => (
                      <p key={p.label} className="leading-relaxed">
                        <span className="font-medium">{p.label}.</span> {p.text}
                      </p>
                    ))
                  : null}
              </CardContent>
            </Card>

            {section.questions.map((q, i) => {
              const value = answers[q.code] ?? "";
              const wc = countWords(value);
              const overLimit = q.wordLimit != null && wc > q.wordLimit;
              return (
                <Card
                  key={q.code}
                  ref={(el) => {
                    questionRefs.current[q.code] = el;
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2 text-sm font-medium">
                      <span>{i + 1}.</span>
                      <span className="flex-1">
                        {q.prompt.text}
                        {q.wordLimit ? (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            (maks. {q.wordLimit} kata)
                          </span>
                        ) : null}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 shrink-0",
                          flagged.has(q.code) && "text-brand-amber",
                        )}
                        onClick={() => handleToggleFlag(q.code)}
                        aria-label="Tandai untuk ditinjau"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    {q.prompt.instructions ? (
                      <p className="text-muted-foreground text-xs">{q.prompt.instructions}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <QuestionInput
                      question={q}
                      value={value}
                      onChange={(v) => handleAnswerChange(q, v)}
                    />
                    {q.wordLimit ? (
                      <p
                        className={cn(
                          "text-xs",
                          overLimit ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {wc} / {q.wordLimit} kata{overLimit ? " — melebihi batas kata" : ""}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
        {submitting ? "Mengirim..." : "Selesai & Submit"}
      </Button>
    </div>
  );
}

function AttemptResultView({
  result,
  onRetry,
  starting,
}: {
  result: AttemptResult;
  onRetry: () => void;
  starting: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hasil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Raw score</p>
              <p className="text-xl font-semibold">
                {result.rawScore} / {result.maxRawScore}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Estimasi band</p>
              <p className="text-xl font-semibold">{result.band ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Waktu dipakai</p>
              <p className="text-xl font-semibold">
                {Math.floor(result.timeUsedSeconds / 60)} menit
              </p>
            </div>
          </div>
          {result.band !== null ? (
            <p className="text-muted-foreground text-xs">
              Estimasi band berdasarkan tabel konversi yang diverifikasi (
              <a
                href={result.bandSourceUrl ?? "#"}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                sumber
              </a>
              ) — bukan skor resmi IELTS.
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Raw score ini di luar cakupan tabel konversi yang diverifikasi, jadi estimasi band
              tidak ditampilkan — lihat raw score di atas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akurasi per Tipe Soal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {Object.entries(result.accuracyByType).map(([type, acc]) => (
            <p key={type} className="flex justify-between">
              <span>{type}</span>
              <span className="text-muted-foreground">
                {acc.correct} / {acc.total}
              </span>
            </p>
          ))}
        </CardContent>
      </Card>

      {result.weakTopics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topik yang Perlu Diperkuat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {result.weakTopics.map((t) => (
              <p key={t.topic} className="flex justify-between">
                <span>{t.topic}</span>
                <span className="text-muted-foreground">{t.wrongCount}x salah</span>
              </p>
            ))}
            <p className="text-muted-foreground mt-2 text-xs">
              Soal yang salah sudah masuk ke Buku Kesalahan untuk direview.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" onClick={onRetry} disabled={starting} variant="outline">
          {starting ? "Memulai..." : "Coba Lagi"}
        </Button>
        <Button render={<Link href="/tryout">Kembali ke Tryout</Link>} />
      </div>
    </div>
  );
}
