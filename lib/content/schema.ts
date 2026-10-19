import { z } from "zod";

/** Mirrors prisma schema enums — kept in sync manually since content files
 * are plain JSON validated before ever touching Prisma. */
export const pedagogicalLevels = ["STARTER", "A1", "A2", "B1", "B2", "C1_ENRICHMENT"] as const;
export const skillAreas = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
  "GRAMMAR",
  "VOCABULARY",
  "PRONUNCIATION",
  "TEST_STRATEGY",
] as const;
export const questionTypes = [
  "MULTIPLE_CHOICE",
  "GAP_FILL",
  "MATCHING",
  "ORDERING",
  "SHORT_ANSWER",
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "SENTENCE_TRANSFORMATION",
  "ERROR_CORRECTION",
  "SUMMARY_COMPLETION",
] as const;
export const listeningSections = ["SECTION_1", "SECTION_2", "SECTION_3", "SECTION_4"] as const;

const codePattern = /^[A-Z][A-Z0-9]*(?:[-_][A-Z0-9]+)*$/;
const codeSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(codePattern, "Kode harus UPPER_SNAKE atau UPPER-KEBAB, mis. STARTER-GRAM-001");

const referenceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  verifiedAt: z.iso.date("verifiedAt harus format YYYY-MM-DD"),
});

const exampleSchema = z.object({
  correct: z.string().min(1),
  incorrect: z.string().min(1).optional(),
  reason: z.string().min(1),
});

const mistakeSchema = z.object({
  mistake: z.string().min(1),
  correction: z.string().min(1),
  note: z.string().optional(),
});

const practiceItemSchema = z.object({
  prompt: z.string().min(1),
  hint: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

const tableSchema = z.object({
  title: z.string().min(1),
  headers: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

export const lessonContentSchema = z.object({
  explanationId: z.string().min(20, "Penjelasan Bahasa Indonesia terlalu pendek"),
  coreConcept: z.string().min(20, "Core concept (English) terlalu pendek"),
  examples: z.array(exampleSchema).min(2, "Minimal 2 contoh benar/salah"),
  realWorldExample: z.string().min(1).optional(),
  ieltsExample: z.string().min(1).optional(),
  tables: z.array(tableSchema).optional(),
  commonMistakes: z.array(mistakeSchema).min(1, "Minimal 1 kesalahan umum"),
  strategy: z.string().min(10),
  guidedPractice: z.array(practiceItemSchema).min(2),
  independentPractice: z.array(practiceItemSchema).min(2),
  summary: z.string().min(10),
  checklist: z.array(z.string().min(1)).min(2),
  applicationTask: z.string().min(1).optional(),
  references: z.array(referenceSchema).optional(),
});
export type LessonContent = z.infer<typeof lessonContentSchema>;

const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });

export const questionSchema = z
  .object({
    code: codeSchema,
    type: z.enum(questionTypes),
    skill: z.enum(skillAreas).optional(),
    level: z.enum(pedagogicalLevels).optional(),
    targetBandRange: z.string().optional(),
    difficulty: z.number().int().min(1).max(5).default(3),
    prompt: z.object({
      text: z.string().min(1),
      instructions: z.string().optional(),
      context: z.string().optional(),
    }),
    options: z.array(optionSchema).optional(),
    answerKey: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    acceptedAnswers: z.array(z.string().min(1)).optional(),
    explanation: z.string().min(10, "Penjelasan jawaban terlalu pendek"),
    /** Evidence-based review (Reading Lab, Master Prompt §8.6) — a short
     * excerpt/paragraph reference, e.g. "Paragraf C: '...'". Optional since
     * only Reading questions currently populate it. */
    evidence: z.string().min(1).optional(),
    /** Soft word-limit hint for free-text answers (e.g. "NO MORE THAN TWO
     * WORDS"), shown in the UI, not enforced as a hard submit block. */
    wordLimit: z.number().int().positive().optional(),
    topics: z.array(z.string().min(1)).default([]),
    estimatedSeconds: z.number().int().positive().optional(),
    sourceType: z.string().default("original"),
  })
  .superRefine((q, ctx) => {
    const keys = Array.isArray(q.answerKey) ? q.answerKey : [q.answerKey];

    if (q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING") {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: `Soal tipe ${q.type} butuh minimal 2 opsi`,
        });
        return;
      }
      const optionIds = new Set(q.options.map((o) => o.id));
      const dupes = q.options.map((o) => o.id).filter((id, i, arr) => arr.indexOf(id) !== i);
      if (dupes.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: `ID opsi duplikat: ${dupes.join(", ")}`,
        });
      }
      for (const key of keys) {
        if (!optionIds.has(key)) {
          ctx.addIssue({
            code: "custom",
            path: ["answerKey"],
            message: `answerKey "${key}" tidak cocok dengan ID opsi manapun`,
          });
        }
      }
    }

    if (
      (q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "YES_NO_NOT_GIVEN") &&
      q.options &&
      q.options.length > 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: `${q.type} tidak menggunakan field "options"`,
      });
    }
  });
export type QuestionContent = z.infer<typeof questionSchema>;

export const lessonFileSchema = z.object({
  code: codeSchema,
  coursePathCode: codeSchema,
  moduleCode: codeSchema,
  title: z.string().min(3),
  level: z.enum(pedagogicalLevels),
  skill: z.enum(skillAreas),
  targetBandRange: z.string().optional(),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  prerequisites: z.array(codeSchema).default([]),
  topics: z.array(z.string().min(1)).default([]),
  objectives: z.array(z.string().min(1)).min(1, "Minimal 1 learning objective"),
  content: lessonContentSchema,
  sourceNotes: z.string().optional(),
  questions: z.array(questionSchema).min(5, "Minimal 5 soal mini-quiz per lesson"),
});
export type LessonFile = z.infer<typeof lessonFileSchema>;

export const coursePathFileSchema = z.object({
  code: codeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
});
export type CoursePathFile = z.infer<typeof coursePathFileSchema>;

export const topicFileSchema = z.object({
  code: z.string().min(1).max(60),
  name: z.string().min(1),
  skill: z.enum(skillAreas).nullable().default(null),
});
export type TopicFile = z.infer<typeof topicFileSchema>;
export const topicRegistrySchema = z.array(topicFileSchema);

export const moduleFileSchema = z.object({
  code: codeSchema,
  coursePathCode: codeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.enum(pedagogicalLevels),
  skill: z.enum(skillAreas),
  order: z.number().int().nonnegative(),
});
export type ModuleFile = z.infer<typeof moduleFileSchema>;

const listeningScriptTurnSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
});

/** A listening question's `skill`/`level` always resolve from the passage
 * (unlike lesson questions, which can override the parent lesson's) — a
 * question only exists in the context of the one passage that produced it. */
export const listeningPassageFileSchema = z.object({
  code: codeSchema,
  title: z.string().min(3),
  section: z.enum(listeningSections),
  level: z.enum(pedagogicalLevels),
  accent: z.string().min(1),
  difficulty: z.number().int().min(1).max(5).default(3),
  /** Filename only, relative to public/audio/listening/ — not a full path,
   * so content JSON stays portable across environments. */
  audioFile: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  script: z.array(listeningScriptTurnSchema).min(1),
  sourceNotes: z.string().optional(),
  questions: z.array(questionSchema).min(3, "Minimal 3 soal per listening passage"),
});
export type ListeningPassageFile = z.infer<typeof listeningPassageFileSchema>;

export const readingExamTypes = ["ACADEMIC", "GENERAL_TRAINING"] as const;

const readingParagraphSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
});

/** A reading question's `skill`/`level` always resolve from the passage,
 * same rationale as listening questions (D-030-adjacent: a question only
 * exists in the context of the one passage that produced it). */
export const readingPassageFileSchema = z.object({
  code: codeSchema,
  title: z.string().min(3),
  examType: z.enum(readingExamTypes),
  level: z.enum(pedagogicalLevels),
  topic: z.string().min(1),
  paragraphs: z.array(readingParagraphSchema).min(1),
  sourceNotes: z.string().optional(),
  questions: z.array(questionSchema).min(5, "Minimal 5 soal per reading passage"),
});
export type ReadingPassageFile = z.infer<typeof readingPassageFileSchema>;
