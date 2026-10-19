"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import { submitDiagnosticAction } from "@/app/(app)/mulai-dari-sini/diagnostic/actions";

export function DiagnosticQuizForm({
  resultId,
  questions,
}: {
  resultId: string;
  questions: QuizQuestionPublic[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answeredCount = questions.filter((q) => (answers[q.code] ?? "").trim().length > 0).length;
  // `=== questions.length` is trivially true at 0/0 — guard explicitly so an
  // empty question bank can't present an enabled "submit" on nothing.
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function handleSubmit() {
    setError(null);
    const payload: Record<string, string | string[]> = {};
    for (const q of questions) {
      payload[q.code] = toSubmittedValue(q, answers[q.code] ?? "");
    }
    startTransition(async () => {
      const result = await submitDiagnosticAction(resultId, payload);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <Progress value={(answeredCount / questions.length) * 100} />
      <p className="text-muted-foreground text-sm">
        {answeredCount} / {questions.length} pertanyaan terjawab
      </p>

      {questions.map((q, i) => (
        <Card key={q.code}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {i + 1}. {q.prompt.text}
            </CardTitle>
            {q.prompt.instructions ? (
              <p className="text-muted-foreground text-xs">{q.prompt.instructions}</p>
            ) : null}
          </CardHeader>
          <CardContent>
            <QuestionInput
              question={q}
              value={answers[q.code] ?? ""}
              onChange={(v) => setAnswers((prev) => ({ ...prev, [q.code]: v }))}
            />
          </CardContent>
        </Card>
      ))}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="button" onClick={handleSubmit} disabled={!allAnswered || pending} size="lg">
        {pending ? "Menyimpan..." : "Lihat Hasil"}
      </Button>
    </div>
  );
}
