"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import { testKinds, readingExamTypes, skillAreas } from "@/lib/content/schema";

const codePattern = /^[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)*$/;
const codeSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(codePattern, "Kode harus UPPER-KEBAB atau UPPER_SNAKE");

const createMockTestSchema = z.object({
  mockTestCode: codeSchema,
  mockTestTitle: z.string().min(3),
  blueprintCode: codeSchema,
  blueprintTitle: z.string().min(3),
  examType: z.enum(readingExamTypes),
  kind: z.enum(testKinds),
  skill: z.enum(skillAreas),
  description: z.string().min(10),
  totalMinutes: z.number().int().positive(),
});

export type CreateMockTestInput = z.infer<typeof createMockTestSchema>;
export type ActionResult = { error: string } | { ok: true; code: string };

/** Admin-authored equivalent of `content/tryout/*.json` — the "test
 * builder" the Master Prompt assigns to Fase 13 (D-038's deferred piece).
 * Validated with the same code pattern as the file-based content
 * pipeline, but this is a live DB mutation, not a file import. */
export async function createMockTestAction(input: CreateMockTestInput): Promise<ActionResult> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  const parsed = createMockTestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const data = parsed.data;

  const [existingBlueprint, existingMockTest] = await Promise.all([
    prisma.testBlueprint.findUnique({ where: { code: data.blueprintCode } }),
    prisma.mockTest.findUnique({ where: { code: data.mockTestCode } }),
  ]);
  if (existingBlueprint) return { error: "Kode blueprint sudah dipakai." };
  if (existingMockTest) return { error: "Kode mock test sudah dipakai." };

  const blueprint = await prisma.testBlueprint.create({
    data: {
      code: data.blueprintCode,
      title: data.blueprintTitle,
      examType: data.examType,
      kind: data.kind,
      skill: data.skill,
      description: data.description,
      totalSeconds: data.totalMinutes * 60,
    },
  });

  const mockTest = await prisma.mockTest.create({
    data: {
      code: data.mockTestCode,
      title: data.mockTestTitle,
      blueprintId: blueprint.id,
      createdById: user.id,
    },
  });

  await logAuditEvent(user.id, "mock_test_created", "MockTest", mockTest.id, {
    code: mockTest.code,
    blueprintCode: blueprint.code,
  });

  revalidatePath("/admin/test-builder");
  return { ok: true, code: mockTest.code };
}

export type AddSectionResult = { error: string } | { ok: true };

export async function addSectionAction(
  mockTestCode: string,
  passageCode: string,
): Promise<AddSectionResult> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const mockTest = await prisma.mockTest.findUnique({
    where: { code: mockTestCode },
    include: { blueprint: true, sections: true },
  });
  if (!mockTest) return { error: "Mock test tidak ditemukan." };

  const nextOrder = mockTest.sections.length + 1;

  if (mockTest.blueprint.skill === "LISTENING") {
    const passage = await prisma.listeningPassage.findUnique({ where: { code: passageCode } });
    if (!passage) return { error: "Listening passage tidak ditemukan." };
    if (passage.reviewStatus !== "PUBLISHED") {
      return { error: "Hanya passage yang sudah PUBLISHED bisa ditambahkan." };
    }
    await prisma.mockTestSection.create({
      data: { mockTestId: mockTest.id, order: nextOrder, listeningPassageId: passage.id },
    });
  } else if (mockTest.blueprint.skill === "READING") {
    const passage = await prisma.readingPassage.findUnique({ where: { code: passageCode } });
    if (!passage) return { error: "Reading passage tidak ditemukan." };
    if (passage.reviewStatus !== "PUBLISHED") {
      return { error: "Hanya passage yang sudah PUBLISHED bisa ditambahkan." };
    }
    await prisma.mockTestSection.create({
      data: { mockTestId: mockTest.id, order: nextOrder, readingPassageId: passage.id },
    });
  } else {
    return { error: `Blueprint skill ${mockTest.blueprint.skill} belum didukung test builder.` };
  }

  await logAuditEvent(user.id, "mock_test_section_updated", "MockTest", mockTest.id, {
    code: mockTestCode,
    added: passageCode,
  });

  revalidatePath(`/admin/test-builder/${mockTestCode}`);
  return { ok: true };
}

export async function removeSectionAction(
  mockTestCode: string,
  sectionId: string,
): Promise<AddSectionResult> {
  const user = await requireRole(["ADMIN", "TEACHER"]);

  const mockTest = await prisma.mockTest.findUnique({
    where: { code: mockTestCode },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!mockTest) return { error: "Mock test tidak ditemukan." };

  const remaining = mockTest.sections.filter((s) => s.id !== sectionId);
  await prisma.$transaction([
    prisma.mockTestSection.delete({ where: { id: sectionId } }),
    ...remaining.map((s, i) =>
      prisma.mockTestSection.update({ where: { id: s.id }, data: { order: i + 1 } }),
    ),
  ]);

  await logAuditEvent(user.id, "mock_test_section_updated", "MockTest", mockTest.id, {
    code: mockTestCode,
    removed: sectionId,
  });

  revalidatePath(`/admin/test-builder/${mockTestCode}`);
  return { ok: true };
}
