"use server";

import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { deleteRecording, saveRecording } from "@/lib/speaking/storage";

export type SpeakingSubmissionDraft = {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED";
  fallbackText: string;
  recording: { id: string; mimeType: string } | null;
};

export async function startSpeakingSubmissionAction(
  promptCode: string,
): Promise<SpeakingSubmissionDraft | { error: string }> {
  const user = await requireUser();
  const prompt = await prisma.speakingPrompt.findUnique({ where: { code: promptCode } });
  if (!prompt || prompt.reviewStatus !== "PUBLISHED") {
    return { error: "Speaking prompt tidak ditemukan." };
  }

  const submission = await prisma.speakingSubmission.create({
    data: { userId: user.id, speakingPromptId: prompt.id },
  });

  return { id: submission.id, status: submission.status, fallbackText: "", recording: null };
}

/** A 1500ms-debounced autosave for the text-fallback path — same as
 * Writing Lab, but purely a UX convenience: completion (below) always
 * sends the current textarea value directly rather than trusting this had
 * time to land, to avoid the exact race fixed in D-035. */
export async function saveFallbackTextAction(
  submissionId: string,
  fallbackText: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const submission = await prisma.speakingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== user.id) return { error: "Submission tidak ditemukan." };
  if (submission.status !== "IN_PROGRESS") return { error: "Submission sudah selesai." };

  await prisma.speakingSubmission.update({ where: { id: submissionId }, data: { fallbackText } });
  return { ok: true };
}

export type UploadRecordingResult = { recordingId: string; mimeType: string } | { error: string };

const MAX_RECORDING_BYTES = 15 * 1024 * 1024; // generous cap for a 1-2 min spoken response

export async function uploadRecordingAction(
  submissionId: string,
  formData: FormData,
): Promise<UploadRecordingResult> {
  const user = await requireUser();
  const submission = await prisma.speakingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== user.id) return { error: "Submission tidak ditemukan." };
  if (submission.status !== "IN_PROGRESS") return { error: "Submission sudah selesai." };

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Rekaman kosong atau tidak valid." };
  if (file.size > MAX_RECORDING_BYTES) return { error: "Rekaman terlalu besar." };

  const durationSeconds = Number(formData.get("durationSeconds") ?? 0);
  const mimeType = file.type || "audio/webm";
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveRecording(user.id, mimeType, buffer);

  const recording = await prisma.speakingRecording.create({
    data: {
      userId: user.id,
      storageKey,
      mimeType,
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      sizeBytes: buffer.length,
    },
  });

  // "Rekam ulang" replaces any previous recording on this submission.
  if (submission.recordingId) {
    const previous = await prisma.speakingRecording.findUnique({
      where: { id: submission.recordingId },
    });
    if (previous) {
      await deleteRecording(previous.storageKey);
      await prisma.speakingRecording.delete({ where: { id: previous.id } }).catch(() => {});
    }
  }

  await prisma.speakingSubmission.update({
    where: { id: submissionId },
    data: { recordingId: recording.id },
  });

  return { recordingId: recording.id, mimeType };
}

export async function deleteRecordingAction(
  submissionId: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const submission = await prisma.speakingSubmission.findUnique({
    where: { id: submissionId },
    include: { recording: true },
  });
  if (!submission || submission.userId !== user.id) return { error: "Submission tidak ditemukan." };
  if (!submission.recording) return { ok: true };

  await prisma.speakingSubmission.update({
    where: { id: submissionId },
    data: { recordingId: null },
  });
  await deleteRecording(submission.recording.storageKey);
  await prisma.speakingRecording.delete({ where: { id: submission.recording.id } }).catch(() => {});

  return { ok: true };
}

export type CompleteResult = { modelAnswer: string; checklistItems: string[] } | { error: string };

/** Takes the current fallback-text value directly from the client rather
 * than trusting the debounced autosave already landed — same fix as
 * D-035's submitWritingAction. Recordings don't have this race: the
 * upload itself is an explicit, awaited action, not a background autosave. */
export async function completeSpeakingSubmissionAction(
  submissionId: string,
  fallbackText: string,
): Promise<CompleteResult> {
  const user = await requireUser();
  const submission = await prisma.speakingSubmission.findUnique({
    where: { id: submissionId },
    include: { speakingPrompt: true },
  });
  if (!submission || submission.userId !== user.id) return { error: "Submission tidak ditemukan." };

  if (submission.status === "COMPLETED") {
    return {
      modelAnswer: submission.speakingPrompt.modelAnswer,
      checklistItems: submission.speakingPrompt.checklistItems as string[],
    };
  }

  const trimmedFallback = fallbackText.trim();
  if (!submission.recordingId && trimmedFallback.length === 0) {
    return { error: "Rekam jawaban Anda atau tulis jawaban terlebih dahulu." };
  }

  await prisma.speakingSubmission.update({
    where: { id: submissionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      fallbackText: submission.recordingId ? submission.fallbackText : trimmedFallback,
    },
  });

  return {
    modelAnswer: submission.speakingPrompt.modelAnswer,
    checklistItems: submission.speakingPrompt.checklistItems as string[],
  };
}

export async function updateSpeakingSelfAssessmentAction(
  submissionId: string,
  selfAssessment: Record<string, boolean>,
): Promise<void> {
  const user = await requireUser();
  const submission = await prisma.speakingSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.userId !== user.id) return;

  await prisma.speakingSubmission.update({ where: { id: submissionId }, data: { selfAssessment } });
}
