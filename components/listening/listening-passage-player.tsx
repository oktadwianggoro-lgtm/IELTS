"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QuestionInput,
  toSubmittedValue,
  type QuizQuestionPublic,
} from "@/components/content/question-input";
import {
  checkListeningAnswersAction,
  type ListeningScriptTurn,
} from "@/app/(app)/listening-lab/[passageCode]/actions";
import { cn } from "@/lib/utils";

type Mode = "practice" | "exam";
type Results = Record<string, { correct: boolean; explanation: string }>;

export function ListeningPassagePlayer({
  passageCode,
  audioUrl,
  questions,
}: {
  passageCode: string;
  audioUrl: string;
  questions: QuizQuestionPublic[];
}) {
  const [mode, setMode] = useState<Mode>("practice");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [script, setScript] = useState<ListeningScriptTurn[] | null>(null);
  const [examPlayed, setExamPlayed] = useState(false);
  const [pending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStartedAt = useRef(0);

  useEffect(() => {
    sessionStartedAt.current = Date.now();
  }, []);

  const locked = results !== null;
  const allAnswered =
    questions.length > 0 && questions.every((q) => (answers[q.code] ?? "").trim().length > 0);
  const canCheck = allAnswered && (mode === "practice" || examPlayed);

  function handleCheck() {
    const payload: Record<string, string | string[]> = {};
    for (const q of questions) payload[q.code] = toSubmittedValue(q, answers[q.code] ?? "");
    const timeSpentMs = Date.now() - sessionStartedAt.current;

    startTransition(async () => {
      const result = await checkListeningAnswersAction(passageCode, payload, timeSpentMs, mode);
      if ("error" in result) return;
      setResults(result.results);
      setScript(result.script);
    });
  }

  const correctCount = results ? Object.values(results).filter((r) => r.correct).length : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!locked ? (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "practice" ? "default" : "outline"}
                onClick={() => setMode("practice")}
              >
                Mode Latihan
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "exam" ? "default" : "outline"}
                onClick={() => setMode("exam")}
              >
                Mode Ujian
              </Button>
            </div>
          ) : null}

          {mode === "practice" ? (
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
          ) : (
            <div className="space-y-2">
              <audio ref={audioRef} src={audioUrl} onPlay={() => setExamPlayed(true)} />
              <p className="text-muted-foreground text-xs">
                Mode ujian: audio hanya bisa diputar satu kali, tanpa kontrol ulang.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={examPlayed}
                onClick={() => audioRef.current?.play()}
              >
                {examPlayed ? "Audio sudah diputar" : "Putar Audio (satu kali)"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const result = results?.[q.code];
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
      </div>

      {!locked ? (
        <Button type="button" onClick={handleCheck} disabled={!canCheck || pending}>
          {pending ? "Memeriksa..." : "Periksa Jawaban"}
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">
          {correctCount} / {questions.length} benar.
        </p>
      )}

      {script ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transkrip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {script.map((turn, i) => (
              <p key={i}>
                <span className="font-medium">{turn.speaker}:</span> {turn.text}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : locked && mode === "exam" ? (
        <p className="text-muted-foreground text-xs">
          Transkrip tidak ditampilkan pada mode ujian. Ulangi dalam mode latihan untuk melihat
          transkrip.
        </p>
      ) : null}
    </div>
  );
}
