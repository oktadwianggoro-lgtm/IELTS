"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  completeSpeakingSubmissionAction,
  deleteRecordingAction,
  saveFallbackTextAction,
  startSpeakingSubmissionAction,
  updateSpeakingSelfAssessmentAction,
  uploadRecordingAction,
  type SpeakingSubmissionDraft,
} from "@/app/(app)/speaking-lab/[promptCode]/actions";

type Phase =
  | "not-started"
  | "choice"
  | "requesting-mic"
  | "mic-error"
  | "prep"
  | "recording"
  | "review-recording"
  | "has-recording"
  | "fallback-text"
  | "completed";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

function initialPhase(
  submission: (SpeakingSubmissionDraft & { selfAssessment: Record<string, boolean> | null }) | null,
): Phase {
  if (!submission) return "not-started";
  if (submission.status === "COMPLETED") return "completed";
  if (submission.recording) return "has-recording";
  if (submission.fallbackText.trim().length > 0) return "fallback-text";
  return "choice";
}

export function SpeakingPromptWorkspace({
  promptCode,
  promptText,
  cueCardPoints,
  followUpQuestions,
  prepSeconds,
  responseSeconds,
  initialSubmission,
  revealedModelAnswer,
  revealedChecklist,
}: {
  promptCode: string;
  promptText: string;
  cueCardPoints: string[] | null;
  followUpQuestions: string[];
  prepSeconds: number;
  responseSeconds: number;
  initialSubmission:
    (SpeakingSubmissionDraft & { selfAssessment: Record<string, boolean> | null }) | null;
  revealedModelAnswer: string | null;
  revealedChecklist: string[] | null;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [phase, setPhase] = useState<Phase>(() => initialPhase(initialSubmission));
  const [fallbackText, setFallbackText] = useState(initialSubmission?.fallbackText ?? "");
  const [recording, setRecording] = useState(initialSubmission?.recording ?? null);
  const [modelAnswer, setModelAnswer] = useState(revealedModelAnswer);
  const [checklist, setChecklist] = useState(revealedChecklist);
  const [selfAssessment, setSelfAssessment] = useState<Record<string, boolean>>(
    initialSubmission?.selfAssessment ?? {},
  );
  const [secondsLeft, setSecondsLeft] = useState(prepSeconds > 0 ? prepSeconds : responseSeconds);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const elapsedSecondsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function beginRecording() {
    const stream = streamRef.current;
    if (!stream) {
      setMicErrorMessage("Mikrofon tidak tersedia lagi. Coba mulai ulang.");
      setPhase("mic-error");
      return;
    }
    chunksRef.current = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      setMicErrorMessage("Perangkat ini tidak mendukung perekaman audio di browser.");
      setPhase("mic-error");
      return;
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      recordedBlobRef.current = blob;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPhase("review-recording");
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    recorder.start();
    recorderRef.current = recorder;
    setPhase("recording");

    let remaining = responseSeconds;
    elapsedSecondsRef.current = 0;
    setSecondsLeft(remaining);
    clearTimer();
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      elapsedSecondsRef.current += 1;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearTimer();
        recorderRef.current?.stop();
      }
    }, 1000);
  }

  function stopRecordingEarly() {
    clearTimer();
    recorderRef.current?.stop();
  }

  function startPrepCountdown() {
    let remaining = prepSeconds;
    setSecondsLeft(remaining);
    clearTimer();
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearTimer();
        beginRecording();
      }
    }, 1000);
  }

  async function handleRequestMic() {
    setMicErrorMessage(null);
    setPhase("requesting-mic");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (prepSeconds > 0) {
        setPhase("prep");
        startPrepCountdown();
      } else {
        beginRecording();
      }
    } catch {
      setMicErrorMessage(
        "Izin mikrofon ditolak atau tidak tersedia. Anda tetap bisa menulis jawaban secara manual.",
      );
      setPhase("mic-error");
    }
  }

  function handleRetryRecording() {
    recordedBlobRef.current = null;
    setPreviewUrl(null);
    setUploadError(null);
    void handleRequestMic();
  }

  function handleUpload() {
    if (!submission || !recordedBlobRef.current) return;
    setUploading(true);
    setUploadError(null);
    const blob = recordedBlobRef.current;
    const fd = new FormData();
    fd.append("audio", blob, `recording.${extensionForMime(blob.type)}`);
    fd.append("durationSeconds", String(elapsedSecondsRef.current));
    uploadRecordingAction(submission.id, fd)
      .then((result) => {
        if ("error" in result) {
          setUploadError(result.error);
          return;
        }
        setRecording({ id: result.recordingId, mimeType: result.mimeType });
        setPhase("has-recording");
      })
      .finally(() => setUploading(false));
  }

  function handleChooseFallback() {
    setMicErrorMessage(null);
    setPhase("fallback-text");
  }

  function scheduleFallbackSave(submissionId: string, text: string) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaving(true);
      saveFallbackTextAction(submissionId, text).finally(() => setSaving(false));
    }, 1500);
  }

  function handleStart() {
    setStarting(true);
    startSpeakingSubmissionAction(promptCode)
      .then((result) => {
        if ("error" in result) return;
        setSubmission({ ...result, selfAssessment: null });
        setFallbackText("");
        setRecording(null);
        setModelAnswer(null);
        setChecklist(null);
        setSelfAssessment({});
        setCompleteError(null);
        setPhase("choice");
      })
      .finally(() => setStarting(false));
  }

  function handleComplete() {
    if (!submission) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setCompleting(true);
    setCompleteError(null);
    completeSpeakingSubmissionAction(submission.id, fallbackText)
      .then((result) => {
        if ("error" in result) {
          setCompleteError(result.error);
          return;
        }
        setSubmission((prev) => (prev ? { ...prev, status: "COMPLETED", fallbackText } : prev));
        setModelAnswer(result.modelAnswer);
        setChecklist(result.checklistItems);
        setPhase("completed");
      })
      .finally(() => setCompleting(false));
  }

  function handleDeleteRecording() {
    if (!submission || !recording) return;
    if (!window.confirm("Hapus rekaman ini secara permanen? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    deleteRecordingAction(submission.id).then((result) => {
      if ("ok" in result) setRecording(null);
    });
  }

  function handleAssessmentToggle(key: string, checked: boolean) {
    if (!submission) return;
    const next = { ...selfAssessment, [key]: checked };
    setSelfAssessment(next);
    void updateSpeakingSelfAssessmentAction(submission.id, next);
  }

  if (!submission) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Belum ada attempt untuk prompt ini. Mulai kapan saja — rekaman bersifat opsional.
          </p>
          <Button type="button" onClick={handleStart} disabled={starting}>
            {starting ? "Memulai..." : "Mulai Latihan"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{promptText}</p>
          {cueCardPoints && cueCardPoints.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {cueCardPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : null}
          {followUpQuestions.length > 0 ? (
            <ol className="list-decimal space-y-1 pl-5">
              {followUpQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          ) : null}
        </CardContent>
      </Card>

      {phase === "choice" ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              Rekaman bersifat opsional. Jika diizinkan, kami akan mengakses mikrofon Anda hanya
              untuk sesi ini — Anda bisa menghapus rekaman kapan saja setelahnya.
            </p>
            <p className="text-muted-foreground text-xs">
              {prepSeconds > 0
                ? `${prepSeconds}s persiapan, lalu ${responseSeconds}s untuk bicara.`
                : `${responseSeconds}s untuk bicara.`}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={handleRequestMic}>
                Izinkan Mikrofon &amp; Rekam
              </Button>
              <Button type="button" variant="outline" onClick={handleChooseFallback}>
                Lewati, tulis jawaban saja
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "requesting-mic" ? (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-center text-sm">
            Meminta izin mikrofon...
          </CardContent>
        </Card>
      ) : null}

      {phase === "mic-error" ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <p className="text-destructive text-sm">{micErrorMessage}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={handleRequestMic}>
                Coba Lagi
              </Button>
              <Button type="button" onClick={handleChooseFallback}>
                Tulis Jawaban Saja
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "prep" ? (
        <Card>
          <CardContent className="space-y-2 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              Waktu persiapan — rekaman segera dimulai
            </p>
            <p className="text-3xl font-semibold tabular-nums">{formatTime(secondsLeft)}</p>
          </CardContent>
        </Card>
      ) : null}

      {phase === "recording" ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <p className="text-destructive flex items-center justify-center gap-2 text-sm">
              <span className="bg-destructive h-2 w-2 animate-pulse rounded-full" /> Merekam...
            </p>
            <p className="text-3xl font-semibold tabular-nums">{formatTime(secondsLeft)}</p>
            <Button type="button" variant="outline" onClick={stopRecordingEarly}>
              Selesai Rekam
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {phase === "review-recording" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tinjau Rekaman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewUrl ? <audio controls src={previewUrl} className="w-full" /> : null}
            {uploadError ? <p className="text-destructive text-sm">{uploadError}</p> : null}
            <div className="flex gap-2">
              <Button type="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Mengirim..." : "Kirim Rekaman"}
              </Button>
              <Button type="button" variant="outline" onClick={handleRetryRecording}>
                Rekam Ulang
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "has-recording" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rekaman Anda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recording ? (
              <audio controls src={`/api/speaking-recordings/${recording.id}`} className="w-full" />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleComplete} disabled={completing}>
                {completing ? "Mengirim..." : "Selesai & Lihat Contoh Jawaban"}
              </Button>
              <Button type="button" variant="outline" onClick={handleRetryRecording}>
                Rekam Ulang
              </Button>
            </div>
            {completeError ? <p className="text-destructive text-sm">{completeError}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {phase === "fallback-text" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Jawaban Tertulis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs">
              {saving ? "Menyimpan draft..." : "Draft tersimpan otomatis"}
            </p>
            <Textarea
              value={fallbackText}
              onChange={(e) => {
                setFallbackText(e.target.value);
                scheduleFallbackSave(submission.id, e.target.value);
              }}
              placeholder="Tulis apa yang ingin Anda katakan di sini..."
              rows={8}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleComplete}
                disabled={completing || fallbackText.trim().length === 0}
              >
                {completing ? "Mengirim..." : "Selesai & Lihat Contoh Jawaban"}
              </Button>
              <Button type="button" variant="outline" onClick={handleRequestMic}>
                Coba Rekam Saja
              </Button>
            </div>
            {completeError ? <p className="text-destructive text-sm">{completeError}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {phase === "completed" ? (
        <>
          {recording ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Rekaman Anda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <audio
                  controls
                  src={`/api/speaking-recordings/${recording.id}`}
                  className="w-full"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleDeleteRecording}>
                  Hapus Rekaman
                </Button>
              </CardContent>
            </Card>
          ) : submission.fallbackText ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Jawaban Tertulis Anda</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-line">
                {submission.fallbackText}
              </CardContent>
            </Card>
          ) : null}

          {checklist ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Self-Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item, i) => (
                  <label key={i} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selfAssessment[`item-${i}`] ?? false}
                      onCheckedChange={(checked) =>
                        handleAssessmentToggle(`item-${i}`, checked === true)
                      }
                    />
                    <span>{item}</span>
                  </label>
                ))}
                <p className="text-muted-foreground text-xs">
                  Ini refleksi mandiri, bukan penilaian otomatis atau skor resmi IELTS.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {modelAnswer ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contoh Jawaban</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-line">
                {modelAnswer}
              </CardContent>
            </Card>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" onClick={handleStart} disabled={starting} variant="outline">
              {starting ? "Memulai..." : "Coba Lagi"}
            </Button>
            <Button render={<Link href="/speaking-lab">Kembali ke Speaking Lab</Link>} />
          </div>
        </>
      ) : null}
    </div>
  );
}
