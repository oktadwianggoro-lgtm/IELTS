"use client";

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

/** Renders the right input widget for a question's type. Shared by the
 * lesson mini-quiz and the diagnostic test so both stay visually/behaviourally
 * consistent and only need fixing in one place. */
export function QuestionInput({
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

/** ORDERING answers are collected as a comma-separated string in the UI but
 * graded as an array — shared so every caller builds the submitted payload
 * the same way. */
export function toSubmittedValue(question: QuizQuestionPublic, raw: string): string | string[] {
  return question.type === "ORDERING" ? raw.split(",").map((s) => s.trim()) : raw;
}
