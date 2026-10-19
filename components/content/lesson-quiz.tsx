"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { checkQuizAnswerAction, type QuizCheckResult } from "@/app/(app)/materi/actions";
import { cn } from "@/lib/utils";

export type QuizQuestionPublic = {
  code: string;
  type: string;
  prompt: { text: string; instructions?: string };
  options: { id: string; text: string }[] | null;
};

const TRUE_FALSE_OPTIONS = [
  { id: "TRUE", label: "True" },
  { id: "FALSE", label: "False" },
  { id: "NOT GIVEN", label: "Not Given" },
];
const YES_NO_OPTIONS = [
  { id: "YES", label: "Yes" },
  { id: "NO", label: "No" },
  { id: "NOT GIVEN", label: "Not Given" },
];

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestionPublic;
  value: string;
  onChange: (v: string) => void;
}) {
  if (question.type === "MULTIPLE_CHOICE" || question.type === "MATCHING") {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="grid-cols-1">
        {(question.options ?? []).map((opt) => (
          <label
            key={opt.id}
            className="border-border has-[[data-checked]]:border-brand-navy flex items-center gap-2 rounded-md border p-2 text-sm"
          >
            <RadioGroupItem value={opt.id} />
            {opt.text}
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (question.type === "TRUE_FALSE_NOT_GIVEN" || question.type === "YES_NO_NOT_GIVEN") {
    const opts = question.type === "TRUE_FALSE_NOT_GIVEN" ? TRUE_FALSE_OPTIONS : YES_NO_OPTIONS;
    return (
      <RadioGroup value={value} onValueChange={onChange} className="grid-cols-3">
        {opts.map((opt) => (
          <label
            key={opt.id}
            className="border-border has-[[data-checked]]:border-brand-navy flex items-center gap-2 rounded-md border p-2 text-sm"
          >
            <RadioGroupItem value={opt.id} />
            {opt.label}
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (question.type === "ORDERING") {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tulis urutan dipisah koma, mis: A, B, C, D"
      />
    );
  }

  return (
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Jawaban Anda" />
  );
}

export function LessonQuiz({ questions }: { questions: QuizQuestionPublic[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, QuizCheckResult>>({});
  const [checking, setChecking] = useState(false);

  const allAnswered = questions.every((q) => (answers[q.code] ?? "").trim().length > 0);

  async function handleCheck() {
    setChecking(true);
    try {
      const entries = await Promise.all(
        questions.map(async (q) => {
          const raw = answers[q.code] ?? "";
          const submitted = q.type === "ORDERING" ? raw.split(",").map((s) => s.trim()) : raw;
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
