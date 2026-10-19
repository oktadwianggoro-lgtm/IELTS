"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { gradeAnswer } from "@/lib/content/grade-answer";

async function getLessonIdByCode(code: string): Promise<string> {
  const lesson = await prisma.lesson.findUniqueOrThrow({ where: { code }, select: { id: true } });
  return lesson.id;
}

export async function toggleBookmarkAction(lessonCode: string): Promise<{ bookmarked: boolean }> {
  const user = await requireUser();
  const lessonId = await getLessonIdByCode(lessonCode);

  const existing = await prisma.bookmark.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await prisma.bookmark.create({ data: { userId: user.id, lessonId } });
  return { bookmarked: true };
}

export async function saveNoteAction(
  lessonCode: string,
  body: string,
): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const lessonId = await getLessonIdByCode(lessonCode);
  const trimmed = body.trim();

  if (!trimmed) {
    await prisma.note.deleteMany({ where: { userId: user.id, lessonId } });
    return { saved: true };
  }

  await prisma.note.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { body: trimmed },
    create: { userId: user.id, lessonId, body: trimmed },
  });
  return { saved: true };
}

export async function markLessonInProgressAction(lessonCode: string): Promise<void> {
  const user = await requireUser();
  const lessonId = await getLessonIdByCode(lessonCode);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId, status: "IN_PROGRESS" },
  });
}

export async function markLessonCompleteAction(lessonCode: string): Promise<void> {
  const user = await requireUser();
  const lessonId = await getLessonIdByCode(lessonCode);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId: user.id, lessonId, status: "COMPLETED", completedAt: new Date() },
  });

  revalidatePath("/dashboard");
}

export type QuizCheckResult = { correct: boolean; explanation: string };

/** Looks the question up server-side and grades it here — the answer key
 * never needs to be sent to the client for this to work. */
export async function checkQuizAnswerAction(
  questionCode: string,
  submitted: string | string[],
): Promise<QuizCheckResult> {
  await requireUser();
  const question = await prisma.question.findUniqueOrThrow({ where: { code: questionCode } });
  const correct = gradeAnswer(question, submitted);
  return { correct, explanation: question.explanation };
}
