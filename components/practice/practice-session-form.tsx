"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import {
  checkPracticeAnswerAction,
  tagMistakeReasonAction,
} from "@/app/(app)/latihan-harian/actions";
import { ERROR_REASON_LABEL } from "@/lib/content/labels";
import { cn } from "@/lib/utils";
import type { ErrorReason } from "@prisma/client";

type CardResult = { correct: boolean; explanation: string };

/** Owns the per-card input and its own answer timer. Keyed by question code
 * in the parent so moving to the next card remounts this fresh — no effect
 * needed to reset `value`, and the timer starts once, on mount, inside an
 * effect rather than during render (see docs/DECISIONS.md D-027). */
function PracticeCard({
  question,
  result,
  pending,
  onCheck,
}: {
  question: QuizQuestionPublic;
  result: CardResult | undefined;
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
      <Card className={cn(result && (result.correct ? "border-success" : "border-destructive"))}>
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-sm font-medium">
            <span className="flex-1">{question.prompt.text}</span>
            {result ? (
              result.correct ? (
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
          {result ? <p className="text-muted-foreground text-sm">{result.explanation}</p> : null}
        </CardContent>
      </Card>

      {!result ? (
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

export function PracticeSessionForm({ questions }: { questions: QuizQuestionPublic[] }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, CardResult>>({});
  const [reasons, setReasons] = useState<Record<string, ErrorReason | null>>({});
  const [pending, startTransition] = useTransition();

  const current = questions[index];
  const done = index >= questions.length;

  function handleCheck(submittedRaw: string, timeSpentMs: number) {
    const submitted = toSubmittedValue(current, submittedRaw);
    startTransition(async () => {
      const result = await checkPracticeAnswerAction(current.code, submitted, timeSpentMs);
      if ("error" in result) return;
      setResults((prev) => ({ ...prev, [current.code]: result }));
    });
  }

  function handleReasonChange(code: string, reason: ErrorReason) {
    setReasons((prev) => ({ ...prev, [code]: reason }));
    startTransition(() => {
      void tagMistakeReasonAction(code, reason);
    });
  }

  if (done) {
    const wrongCodes = questions
      .map((q) => q.code)
      .filter((code) => results[code]?.correct === false);
    const correctCount = questions.filter((q) => results[q.code]?.correct).length;

    return (
      <div className="space-y-4">
        <Card className="border-brand-navy/20 bg-brand-navy/5">
          <CardHeader>
            <CardTitle>Sesi latihan selesai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">
              {correctCount} / {questions.length} jawaban benar.
            </p>
            {wrongCodes.length > 0 ? (
              <p className="text-muted-foreground text-sm">
                {wrongCodes.length} soal ditambahkan ke Buku Kesalahan untuk direview nanti.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {wrongCodes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tandai alasan kesalahan (opsional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wrongCodes.map((code) => {
                const q = questions.find((item) => item.code === code)!;
                return (
                  <div
                    key={code}
                    className="border-border space-y-1.5 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm">{q.prompt.text}</p>
                    <Select
                      value={reasons[code] ?? undefined}
                      onValueChange={(v) => handleReasonChange(code, v as ErrorReason)}
                    >
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Pilih alasan" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ERROR_REASON_LABEL) as ErrorReason[]).map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {ERROR_REASON_LABEL[reason]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex gap-2">
          <Button render={<Link href="/latihan-harian">Latihan Lagi</Link>} variant="outline" />
          <Button
            render={<Link href="/buku-kesalahan">Buka Buku Kesalahan</Link>}
            variant="outline"
          />
          <Button render={<Link href="/dashboard">Kembali ke Beranda</Link>} />
        </div>
      </div>
    );
  }

  const result = results[current.code];

  return (
    <div className="space-y-4">
      <Progress value={(index / questions.length) * 100} />
      <p className="text-muted-foreground text-sm">
        Soal {index + 1} / {questions.length}
      </p>

      <PracticeCard
        key={current.code}
        question={current}
        result={result}
        pending={pending}
        onCheck={handleCheck}
      />

      {result ? (
        <Button type="button" onClick={() => setIndex((i) => i + 1)}>
          {index + 1 < questions.length ? "Lanjut" : "Lihat Ringkasan"}
        </Button>
      ) : null}
    </div>
  );
}
