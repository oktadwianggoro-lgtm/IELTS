import "server-only";
import { prisma } from "@/lib/db";
import type { ReadingExamType, SkillArea } from "@prisma/client";

export type RawToBandResult =
  | { band: number; sourceUrl: string; verifiedAt: Date }
  | { band: null; reason: "no_conversion_table" };

/**
 * Looks up the estimated band for a raw score from the *active* row set in
 * `BandConversionTable` — never a hardcoded table in app code (Master
 * Prompt §8.9/§13: "jangan memasang angka konversi sebagai konstanta
 * permanen"). Returns `band: null` rather than guessing if no active row
 * covers the exam type/section/score — see docs/SCORING.md §"Jika sumber
 * tidak mendukung konversi presisi".
 */
export async function rawToBand(
  rawScore: number,
  section: SkillArea,
  examType: ReadingExamType,
): Promise<RawToBandResult> {
  const row = await prisma.bandConversionTable.findFirst({
    where: {
      examType,
      section,
      active: true,
      minRaw: { lte: rawScore },
      maxRaw: { gte: rawScore },
    },
  });

  if (!row) return { band: null, reason: "no_conversion_table" };
  return { band: row.band, sourceUrl: row.sourceUrl, verifiedAt: row.verifiedAt };
}
