"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import {
  checkMistakeReviewAction,
  rateMistakeReviewAction,
  type MistakeCheckResult,
} from "@/app/(app)/buku-kesalahan/actions";
import { cn } from "@/lib/utils";

type ReviewItem = { entryId: string; question: QuizQuestionPublic };
type Feedback = Extract<MistakeCheckResult, { correct: boolean }>;

/** Owns the per-card input and its own answer timer; keyed by `entryId` in
 * the parent so advancing to the next card remounts this fresh instead of
 * resetting state via an effect (see docs/DECISIONS.md D-027). */
function ReviewCard({
  question,
  feedback,
  pending,
  onCheck,
}: {
  question: QuizQuestionPublic;
  feedback: Feedback | undefined;
  pending: boolean;
  onCheck: (submittedRaw: string, timeSpentMs: number) => void;
}) {
  const [value, setValue] = useState("");
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return (
    <>
      <Card
        className={cn(feedback && (feedback.correct ? "border-success" : "border-destructive"))}
      >
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-sm font-medium">
            <span className="flex-1">{question.prompt.text}</span>
            {feedback ? (
              feedback.correct ? (
                <CheckCircle2 className="text-success h-4 w-4 shrink-0" aria-label="Benar" />
              ) : (
                <XCircle className="text-destructive h-4 w-4 shrink-0" aria-label="Salah" />
              )
            ) : null}
          </CardTitle>
          {question.prompt.instructions ? (
            <p className="text-muted-foreground text-xs">{question.prompt.instructions}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          <QuestionInput question={question} value={value} onChange={setValue} />

          {feedback ? (
            <div className="border-border bg-muted/40 space-y-1 rounded-md border p-3 text-sm">
              <p>
                <span className="font-medium">Jawaban yang diharapkan:</span> {feedback.expected}
              </p>
              <p className="text-muted-foreground">{feedback.explanation}</p>
              {feedback.lessonHref ? (
                <Link href={feedback.lessonHref} className="text-brand-navy underline">
                  Buka lesson terkait
                </Link>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!feedback ? (
        <Button
          type="button"
          onClick={() => onCheck(value, Date.now() - startedAt.current)}
          disabled={!value.trim() || pending}
        >
          {pending ? "Memeriksa..." : "Periksa Jawaban"}
        </Button>
      ) : null}
    </>
  );
}

export function MistakeReviewSession({ items: initialItems }: { items: ReviewItem[] }) {
  // Snapshotted once: `rateMistakeReviewAction` revalidates the page, which
  // re-fetches a SHORTER due-list from the server (the just-rated card drops
  // out). If this component kept reading that shrinking array through a
  // plain numeric `index`, each successful rating would silently skip the
  // next card — the index would point one past where it should (see
  // docs/DECISIONS.md D-028). Working through a fixed batch avoids that.
  const [items] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  const current = items[index];
  const done = index >= items.length;

  function handleCheck(submittedRaw: string, timeSpentMs: number) {
    const submitted = toSubmittedValue(current.question, submittedRaw);
    startTransition(async () => {
      const result = await checkMistakeReviewAction(current.entryId, submitted, timeSpentMs);
      if ("error" in result) return;
      setFeedback(result);
    });
  }

  function handleRate(quality: 0 | 3 | 5) {
    startTransition(async () => {
      await rateMistakeReviewAction(current.entryId, quality);
      setFeedback(null);
      setIndex((i) => i + 1);
    });
  }

  if (done) {
    return (
      <Card className="border-brand-navy/20 bg-brand-navy/5">
        <CardHeader>
          <CardTitle>Review selesai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {items.length} kartu sudah direview. Jadwal review berikutnya sudah diperbarui otomatis.
          </p>
          <div className="flex gap-2">
            <Button render={<Link href="/latihan-harian">Latihan Harian</Link>} variant="outline" />
            <Button render={<Link href="/dashboard">Kembali ke Beranda</Link>} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Progress value={(index / items.length) * 100} />
      <p className="text-muted-foreground text-sm">
        Kartu {index + 1} / {items.length}
      </p>

      <ReviewCard
        key={current.entryId}
        question={current.question}
        feedback={feedback ?? undefined}
        pending={pending}
        onCheck={handleCheck}
      />

      {feedback ? (
        feedback.correct ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRate(3)}
              disabled={pending}
            >
              Lumayan sulit
            </Button>
            <Button type="button" onClick={() => handleRate(5)} disabled={pending}>
              Mudah
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={() => handleRate(0)} disabled={pending}>
            Lanjut
          </Button>
        )
      ) : null}
    </div>
  );
}
