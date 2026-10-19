"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import {
  checkReadingAnswersAction,
  type ReadingQuestionResult,
} from "@/app/(app)/reading-lab/[passageCode]/actions";
import { cn } from "@/lib/utils";

const TIME_BUDGET_SECONDS = 20 * 60;

type ReadingQuestion = QuizQuestionPublic & { wordLimit: number | null };
type Results = Record<string, ReadingQuestionResult>;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function loadDraft(passageCode: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`reading-draft:${passageCode}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDraft(passageCode: string, answers: Record<string, string>) {
  try {
    localStorage.setItem(`reading-draft:${passageCode}`, JSON.stringify(answers));
  } catch {
    // Private browsing / blocked storage — autosave is a convenience, not
    // a requirement, so fail silently rather than breaking the page.
  }
}

function clearDraft(passageCode: string) {
  try {
    localStorage.removeItem(`reading-draft:${passageCode}`);
  } catch {
    // Same as above.
  }
}

export function ReadingPassageWorkspace({
  passageCode,
  paragraphs,
  questions,
}: {
  passageCode: string;
  paragraphs: { label: string; text: string }[];
  questions: ReadingQuestion[];
}) {
  // Lazy initializer: runs once on mount, not during every render — reading
  // localStorage here (rather than via setState inside an effect) avoids
  // the cascading-render lint rule and matches React's own recommended
  // pattern for hydrating state from an external synchronous source.
  const [answers, setAnswers] = useState<Record<string, string>>(() => loadDraft(passageCode));
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Results | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIME_BUDGET_SECONDS);
  const [pending, setPending] = useState(false);
  const sessionStartedAt = useRef(0);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    sessionStartedAt.current = Date.now();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Object.keys(answers).length > 0) saveDraft(passageCode, answers);
  }, [passageCode, answers]);

  const locked = results !== null;
  const answeredCount = questions.filter((q) => (answers[q.code] ?? "").trim().length > 0).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function toggleFlag(code: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleHighlight(label: string) {
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function scrollToQuestion(code: string) {
    questionRefs.current[code]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleSubmit() {
    const payload: Record<string, string | string[]> = {};
    for (const q of questions) payload[q.code] = toSubmittedValue(q, answers[q.code] ?? "");
    const timeSpentMs = Date.now() - sessionStartedAt.current;

    setPending(true);
    checkReadingAnswersAction(passageCode, payload, timeSpentMs)
      .then((result) => {
        if ("error" in result) return;
        setResults(result.results);
        clearDraft(passageCode);
      })
      .finally(() => setPending(false));
  }

  const correctCount = results ? Object.values(results).filter((r) => r.correct).length : 0;

  return (
    <div className="space-y-4">
      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
        <div className="flex flex-wrap gap-1">
          {questions.map((q, i) => {
            const answered = (answers[q.code] ?? "").trim().length > 0;
            const isFlagged = flagged.has(q.code);
            return (
              <button
                key={q.code}
                type="button"
                onClick={() => scrollToQuestion(q.code)}
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded border text-xs",
                  answered ? "border-brand-navy bg-brand-navy/10" : "border-border",
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
            secondsLeft < 120 && "text-destructive",
          )}
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:sticky lg:top-4 lg:max-h-[80vh] lg:overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">Passage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {paragraphs.map((p) => (
              <p
                key={p.label}
                onClick={() => toggleHighlight(p.label)}
                className={cn(
                  "cursor-pointer rounded-sm p-1 leading-relaxed",
                  highlighted.has(p.label) && "bg-brand-amber/20",
                )}
              >
                <span className="font-medium">{p.label}.</span> {p.text}
              </p>
            ))}
            <p className="text-muted-foreground text-xs">
              Klik paragraf untuk menandai (highlight) bagian yang penting.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const result = results?.[q.code];
            const value = answers[q.code] ?? "";
            const wc = wordCount(value);
            const overLimit = q.wordLimit != null && wc > q.wordLimit;
            return (
              <Card
                key={q.code}
                ref={(el) => {
                  questionRefs.current[q.code] = el;
                }}
                className={cn(result && (result.correct ? "border-success" : "border-destructive"))}
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
                    {result ? (
                      result.correct ? (
                        <CheckCircle2
                          className="text-success h-4 w-4 shrink-0"
                          aria-label="Benar"
                        />
                      ) : (
                        <XCircle className="text-destructive h-4 w-4 shrink-0" aria-label="Salah" />
                      )
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 shrink-0",
                          flagged.has(q.code) && "text-brand-amber",
                        )}
                        onClick={() => toggleFlag(q.code)}
                        aria-label="Tandai untuk ditinjau"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  {q.prompt.instructions ? (
                    <p className="text-muted-foreground text-xs">{q.prompt.instructions}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-2">
                  <QuestionInput
                    question={q}
                    value={value}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.code]: v }))}
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
                  {result ? (
                    <div className="border-border bg-muted/40 space-y-1 rounded-md border p-3 text-sm">
                      <p className="text-muted-foreground">{result.explanation}</p>
                      {result.evidence ? (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Bukti:</span> {result.evidence}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {!locked ? (
        <Button type="button" onClick={handleSubmit} disabled={!allAnswered || pending}>
          {pending ? "Memeriksa..." : "Periksa Jawaban"}
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">
          {correctCount} / {questions.length} benar.
        </p>
      )}
    </div>
  );
}
