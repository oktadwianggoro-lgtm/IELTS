"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveQuestionReportAction } from "@/app/(admin)/admin/question-reports/actions";

export function QuestionReportRow({
  report,
}: {
  report: {
    id: string;
    reason: string;
    details: string | null;
    createdAt: Date;
    reportedBy: { name: string | null; email: string };
    question: { code: string; prompt: unknown };
    parentContentCode: string | null;
  };
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const prompt = report.question.prompt as { text?: string } | null;

  function handleResolve(status: "RESOLVED" | "DISMISSED") {
    setSubmitting(true);
    setError(null);
    resolveQuestionReportAction(report.id, status, notes)
      .then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setResolved(true);
      })
      .finally(() => setSubmitting(false));
  }

  if (resolved) return null;

  return (
    <div className="border-border space-y-2 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {report.parentContentCode ? (
          <Link
            href={`/admin/content/${report.parentContentCode}`}
            className="font-medium hover:underline"
          >
            Soal {report.question.code}
          </Link>
        ) : (
          <span className="font-medium">Soal {report.question.code}</span>
        )}
        <span className="text-muted-foreground text-xs">
          {report.createdAt.toLocaleString("id-ID")}
        </span>
      </div>
      {prompt?.text ? (
        <p className="text-muted-foreground text-xs italic">&ldquo;{prompt.text}&rdquo;</p>
      ) : null}
      <Badge variant="outline">{report.reason}</Badge>
      {report.details ? <p>{report.details}</p> : null}
      <p className="text-muted-foreground text-xs">
        Dilaporkan oleh: {report.reportedBy.name ?? report.reportedBy.email}
      </p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan penyelesaian (opsional)"
        rows={2}
      />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => handleResolve("RESOLVED")}
          disabled={submitting}
        >
          Tandai Selesai
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleResolve("DISMISSED")}
          disabled={submitting}
        >
          Abaikan
        </Button>
      </div>
    </div>
  );
}
