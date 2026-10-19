"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkQuizAnswerAction, type QuizCheckResult } from "@/app/(app)/materi/actions";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import { cn } from "@/lib/utils";

export type { QuizQuestionPublic };

export function LessonQuiz({ questions }: { questions: QuizQuestionPublic[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QuizCheckResult>>({});
  const [checking, setChecking] = useState(false);

  // `.every()` is vacuously true on an empty array — guard explicitly (see
  // docs/DECISIONS.md D-024 for the same bug caught elsewhere).
  const allAnswered =
    questions.length > 0 && questions.every((q) => (answers[q.code] ?? "").trim().length > 0);

  async function handleCheck() {
    setChecking(true);
    try {
      const entries = await Promise.all(
        questions.map(async (q) => {
          const submitted = toSubmittedValue(q, answers[q.code] ?? "");
          const result = await checkQuizAnswerAction(q.code, submitted);
          return [q.code, result] as const;
        }),
      );
      setResults(Object.fromEntries(entries));
    } finally {
      setChecking(false);
    }
  }

  const checkedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter((r) => r.correct).length;

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const result = results[q.code];
        return (
          <Card
            key={q.code}
            className={cn(result && (result.correct ? "border-success" : "border-destructive"))}
          >
            <CardHeader>
              <CardTitle className="flex items-start gap-2 text-sm font-medium">
                <span>{i + 1}.</span>
                <span className="flex-1">{q.prompt.text}</span>
                {result ? (
                  result.correct ? (
                    <CheckCircle2 className="text-success h-4 w-4 shrink-0" aria-label="Benar" />
                  ) : (
                    <XCircle className="text-destructive h-4 w-4 shrink-0" aria-label="Salah" />
                  )
                ) : null}
              </CardTitle>
              {q.prompt.instructions ? (
                <p className="text-muted-foreground text-xs">{q.prompt.instructions}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
              <QuestionInput
                question={q}
                value={answers[q.code] ?? ""}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.code]: v }))}
              />
              {result ? (
                <p className="text-muted-foreground text-sm">{result.explanation}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between">
        <Button type="button" onClick={handleCheck} disabled={!allAnswered || checking}>
          {checking ? "Memeriksa..." : "Periksa Jawaban"}
        </Button>
        {checkedCount > 0 ? (
          <p className="text-muted-foreground text-sm">
            {correctCount} / {checkedCount} benar
          </p>
        ) : null}
      </div>
    </div>
  );
}
