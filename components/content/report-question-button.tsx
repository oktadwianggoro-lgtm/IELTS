"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportQuestionAction } from "@/lib/question-reports/actions";

const REASONS = [
  { value: "wrong_answer_key", label: "Kunci jawaban sepertinya salah" },
  { value: "confusing_wording", label: "Pertanyaan membingungkan/ambigu" },
  { value: "typo_or_formatting", label: "Salah ketik atau format rusak" },
  { value: "other", label: "Lainnya" },
];

/** Shared by every lab's post-check result view (Master Prompt §11:
 * "laporan soal bermasalah") — one component, not duplicated per lab. */
export function ReportQuestionButton({ questionCode }: { questionCode: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    setSubmitting(true);
    setError(null);
    reportQuestionAction(questionCode, reason, details)
      .then((result) => {
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setSent(true);
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setReason("");
          setDetails("");
          setError(null);
          setSent(false);
        }
      }}
    >
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag className="mr-1 h-3.5 w-3.5" aria-hidden />
        Laporkan soal
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan Soal Ini</DialogTitle>
        </DialogHeader>
        {sent ? (
          <p className="text-success text-sm">
            Terima kasih, laporan Anda sudah terkirim ke tim konten.
          </p>
        ) : (
          <div className="space-y-3">
            <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih alasan" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detail tambahan (opsional)"
              rows={3}
            />
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>
        )}
        {!sent ? (
          <DialogFooter>
            <Button type="button" onClick={handleSubmit} disabled={submitting || !reason}>
              {submitting ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
