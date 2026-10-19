import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  coursePathFileSchema,
  lessonFileSchema,
  listeningPassageFileSchema,
  mockTestFileSchema,
  moduleFileSchema,
  readingPassageFileSchema,
  speakingPromptFileSchema,
  topicRegistrySchema,
  writingTaskFileSchema,
  type CoursePathFile,
  type LessonFile,
  type ListeningPassageFile,
  type MockTestFile,
  type ModuleFile,
  type ReadingPassageFile,
  type SpeakingPromptFile,
  type TopicFile,
  type WritingTaskFile,
} from "./schema";

export type ContentError = { file: string; message: string };

export type LoadedContent = {
  ok: boolean;
  errors: ContentError[];
  topics: TopicFile[];
  coursePaths: CoursePathFile[];
  modules: ModuleFile[];
  lessons: LessonFile[];
  listeningPassages: ListeningPassageFile[];
  readingPassages: ReadingPassageFile[];
  writingTasks: WritingTaskFile[];
  speakingPrompts: SpeakingPromptFile[];
  mockTests: MockTestFile[];
};

function walkJsonFiles(dir: string): string[] {
  let out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out = out.concat(walkJsonFiles(full));
    } else if (entry.endsWith(".json")) {
      out.push(full);
    }
  }
  return out;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

/** Loads every content JSON file under `contentRoot`, validates each one
 * individually against its Zod schema, then runs cross-file checks (unique
 * codes, prerequisite/topic/module references that actually resolve). Never
 * throws — callers inspect `.ok`/`.errors` so a CLI or importer can report
 * every problem at once instead of stopping at the first file. */
export function loadContent(contentRoot: string): LoadedContent {
  const errors: ContentError[] = [];
  const rel = (p: string) => relative(contentRoot, p).replace(/\\/g, "/");

  // ---- topics registry ----
  let topics: TopicFile[] = [];
  const topicsPath = join(contentRoot, "topics.json");
  try {
    const parsed = topicRegistrySchema.safeParse(readJson(topicsPath));
    if (parsed.success) {
      topics = parsed.data;
    } else {
      errors.push({
        file: rel(topicsPath),
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
    }
  } catch (e) {
    errors.push({
      file: rel(topicsPath),
      message: `Tidak bisa membaca/parse: ${(e as Error).message}`,
    });
  }
  const topicCodes = new Set(topics.map((t) => t.code));
  const dupTopicCodes = topics.map((t) => t.code).filter((c, i, arr) => arr.indexOf(c) !== i);
  for (const code of new Set(dupTopicCodes)) {
    errors.push({ file: rel(topicsPath), message: `Kode topic duplikat: ${code}` });
  }

  // ---- course paths ----
  const coursePaths: CoursePathFile[] = [];
  for (const file of walkJsonFiles(join(contentRoot, "course-paths"))) {
    const parsed = coursePathFileSchema.safeParse(readJson(file));
    if (parsed.success) coursePaths.push(parsed.data);
    else
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
  }
  const coursePathCodes = new Set(coursePaths.map((c) => c.code));
  for (const code of new Set(
    coursePaths.map((c) => c.code).filter((c, i, arr) => arr.indexOf(c) !== i),
  )) {
    errors.push({ file: "course-paths/", message: `Kode course path duplikat: ${code}` });
  }

  // ---- modules ----
  const modules: ModuleFile[] = [];
  for (const file of walkJsonFiles(join(contentRoot, "modules"))) {
    const parsed = moduleFileSchema.safeParse(readJson(file));
    if (parsed.success) {
      modules.push(parsed.data);
      if (!coursePathCodes.has(parsed.data.coursePathCode)) {
        errors.push({
          file: rel(file),
          message: `coursePathCode "${parsed.data.coursePathCode}" tidak ditemukan di content/course-paths/`,
        });
      }
    } else {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
    }
  }
  const moduleCodes = new Map(modules.map((m) => [m.code, m]));
  for (const code of new Set(
    modules.map((m) => m.code).filter((c, i, arr) => arr.indexOf(c) !== i),
  )) {
    errors.push({ file: "modules/", message: `Kode module duplikat: ${code}` });
  }

  // ---- lessons ----
  const lessons: LessonFile[] = [];
  const lessonFilesByCode = new Map<string, string>();
  for (const file of walkJsonFiles(join(contentRoot, "lessons"))) {
    const parsed = lessonFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const lesson = parsed.data;
    lessons.push(lesson);

    if (lessonFilesByCode.has(lesson.code)) {
      errors.push({
        file: rel(file),
        message: `Kode lesson duplikat "${lesson.code}" (juga di ${lessonFilesByCode.get(lesson.code)})`,
      });
    }
    lessonFilesByCode.set(lesson.code, rel(file));

    const mod = moduleCodes.get(lesson.moduleCode);
    if (!mod) {
      errors.push({
        file: rel(file),
        message: `moduleCode "${lesson.moduleCode}" tidak ditemukan di content/modules/`,
      });
    } else if (mod.coursePathCode !== lesson.coursePathCode) {
      errors.push({
        file: rel(file),
        message: `coursePathCode "${lesson.coursePathCode}" tidak cocok dengan module "${lesson.moduleCode}" (seharusnya "${mod.coursePathCode}")`,
      });
    }

    for (const topicCode of lesson.topics) {
      if (!topicCodes.has(topicCode)) {
        errors.push({
          file: rel(file),
          message: `Topic "${topicCode}" tidak terdaftar di content/topics.json`,
        });
      }
    }

    const questionCodes = new Set<string>();
    for (const q of lesson.questions) {
      if (questionCodes.has(q.code)) {
        errors.push({
          file: rel(file),
          message: `Kode question duplikat dalam lesson ini: ${q.code}`,
        });
      }
      questionCodes.add(q.code);
      for (const topicCode of q.topics) {
        if (!topicCodes.has(topicCode)) {
          errors.push({
            file: rel(file),
            message: `Question ${q.code}: topic "${topicCode}" tidak terdaftar di content/topics.json`,
          });
        }
      }
    }
  }

  // prerequisites must resolve to real lesson codes (checked after all lessons loaded)
  const allLessonCodes = new Set(lessons.map((l) => l.code));
  for (const lesson of lessons) {
    for (const prereq of lesson.prerequisites) {
      if (!allLessonCodes.has(prereq)) {
        errors.push({
          file: lessonFilesByCode.get(lesson.code) ?? lesson.code,
          message: `Prerequisite "${prereq}" tidak ditemukan sebagai kode lesson manapun`,
        });
      }
      if (prereq === lesson.code) {
        errors.push({
          file: lessonFilesByCode.get(lesson.code) ?? lesson.code,
          message: `Lesson tidak boleh menjadi prasyarat dirinya sendiri`,
        });
      }
    }
  }

  // ---- listening passages ----
  const listeningPassages: ListeningPassageFile[] = [];
  const listeningFilesByCode = new Map<string, string>();
  for (const file of walkJsonFiles(join(contentRoot, "listening"))) {
    const parsed = listeningPassageFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const passage = parsed.data;
    listeningPassages.push(passage);

    if (listeningFilesByCode.has(passage.code)) {
      errors.push({
        file: rel(file),
        message: `Kode listening passage duplikat "${passage.code}" (juga di ${listeningFilesByCode.get(passage.code)})`,
      });
    }
    listeningFilesByCode.set(passage.code, rel(file));

    const questionCodes = new Set<string>();
    for (const q of passage.questions) {
      if (questionCodes.has(q.code)) {
        errors.push({
          file: rel(file),
          message: `Kode question duplikat dalam passage ini: ${q.code}`,
        });
      }
      questionCodes.add(q.code);
      for (const topicCode of q.topics) {
        if (!topicCodes.has(topicCode)) {
          errors.push({
            file: rel(file),
            message: `Question ${q.code}: topic "${topicCode}" tidak terdaftar di content/topics.json`,
          });
        }
      }
    }
  }
  const dupPassageCodes = listeningPassages
    .map((p) => p.code)
    .filter((c, i, arr) => arr.indexOf(c) !== i);
  for (const code of new Set(dupPassageCodes)) {
    errors.push({ file: "listening/", message: `Kode listening passage duplikat: ${code}` });
  }

  // ---- reading passages ----
  const readingPassages: ReadingPassageFile[] = [];
  const readingFilesByCode = new Map<string, string>();
  for (const file of walkJsonFiles(join(contentRoot, "reading"))) {
    const parsed = readingPassageFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const passage = parsed.data;
    readingPassages.push(passage);

    if (readingFilesByCode.has(passage.code)) {
      errors.push({
        file: rel(file),
        message: `Kode reading passage duplikat "${passage.code}" (juga di ${readingFilesByCode.get(passage.code)})`,
      });
    }
    readingFilesByCode.set(passage.code, rel(file));

    const paragraphLabels = new Set(passage.paragraphs.map((p) => p.label));
    const questionCodes = new Set<string>();
    for (const q of passage.questions) {
      if (questionCodes.has(q.code)) {
        errors.push({
          file: rel(file),
          message: `Kode question duplikat dalam passage ini: ${q.code}`,
        });
      }
      questionCodes.add(q.code);
      for (const topicCode of q.topics) {
        if (!topicCodes.has(topicCode)) {
          errors.push({
            file: rel(file),
            message: `Question ${q.code}: topic "${topicCode}" tidak terdaftar di content/topics.json`,
          });
        }
      }
      // MATCHING questions used for "matching information/headings/features"
      // style reading items reference a paragraph label as their options —
      // catch a typo'd paragraph reference early rather than at render time.
      if (q.type === "MATCHING" && q.options) {
        for (const opt of q.options) {
          if (opt.id.length === 1 && /^[A-Z]$/.test(opt.id) && !paragraphLabels.has(opt.id)) {
            errors.push({
              file: rel(file),
              message: `Question ${q.code}: opsi "${opt.id}" tidak cocok dengan label paragraf manapun di passage ini`,
            });
          }
        }
      }
    }
  }
  const dupReadingPassageCodes = readingPassages
    .map((p) => p.code)
    .filter((c, i, arr) => arr.indexOf(c) !== i);
  for (const code of new Set(dupReadingPassageCodes)) {
    errors.push({ file: "reading/", message: `Kode reading passage duplikat: ${code}` });
  }

  // global question code uniqueness across all lessons, listening, and reading
  const allQuestionCodes = new Map<string, string>();
  for (const lesson of lessons) {
    for (const q of lesson.questions) {
      const existing = allQuestionCodes.get(q.code);
      if (existing && existing !== lesson.code) {
        errors.push({
          file: lessonFilesByCode.get(lesson.code) ?? lesson.code,
          message: `Kode question "${q.code}" dipakai juga di "${existing}"`,
        });
      }
      allQuestionCodes.set(q.code, lesson.code);
    }
  }
  for (const passage of listeningPassages) {
    for (const q of passage.questions) {
      const existing = allQuestionCodes.get(q.code);
      if (existing && existing !== passage.code) {
        errors.push({
          file: listeningFilesByCode.get(passage.code) ?? passage.code,
          message: `Kode question "${q.code}" dipakai juga di "${existing}"`,
        });
      }
      allQuestionCodes.set(q.code, passage.code);
    }
  }
  for (const passage of readingPassages) {
    for (const q of passage.questions) {
      const existing = allQuestionCodes.get(q.code);
      if (existing && existing !== passage.code) {
        errors.push({
          file: readingFilesByCode.get(passage.code) ?? passage.code,
          message: `Kode question "${q.code}" dipakai juga di "${existing}"`,
        });
      }
      allQuestionCodes.set(q.code, passage.code);
    }
  }

  // ---- writing tasks ----
  // Free-response, never graded via `Question`/`gradeAnswer`, so writing
  // task codes live in their own namespace — no cross-check against
  // `allQuestionCodes` needed, just duplicate-detection among themselves.
  const writingTasks: WritingTaskFile[] = [];
  const dupWritingTaskCodes = new Set<string>();
  for (const file of walkJsonFiles(join(contentRoot, "writing"))) {
    const parsed = writingTaskFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const task = parsed.data;
    if (writingTasks.some((t) => t.code === task.code)) {
      dupWritingTaskCodes.add(task.code);
    }
    writingTasks.push(task);
  }
  for (const code of dupWritingTaskCodes) {
    errors.push({ file: "writing/", message: `Kode writing task duplikat: ${code}` });
  }

  // ---- speaking prompts ----
  // Free-response (self-assessment + model answer), same rationale as
  // writing tasks — own code namespace, no `Question` cross-check needed.
  const speakingPrompts: SpeakingPromptFile[] = [];
  const dupSpeakingPromptCodes = new Set<string>();
  for (const file of walkJsonFiles(join(contentRoot, "speaking"))) {
    const parsed = speakingPromptFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const prompt = parsed.data;
    if (speakingPrompts.some((p) => p.code === prompt.code)) {
      dupSpeakingPromptCodes.add(prompt.code);
    }
    speakingPrompts.push(prompt);
  }
  for (const code of dupSpeakingPromptCodes) {
    errors.push({ file: "speaking/", message: `Kode speaking prompt duplikat: ${code}` });
  }

  // ---- mock tests (tryout) ----
  // Sections only reference existing listening/reading passage codes — no
  // passage content is authored here. Cross-check every reference resolves
  // to a passage actually loaded above.
  const listeningCodes = new Set(listeningPassages.map((p) => p.code));
  const readingCodes = new Set(readingPassages.map((p) => p.code));
  const mockTests: MockTestFile[] = [];
  const dupMockTestCodes = new Set<string>();
  const dupBlueprintCodes = new Set<string>();
  const seenBlueprintCodes = new Set<string>();
  for (const file of walkJsonFiles(join(contentRoot, "tryout"))) {
    const parsed = mockTestFileSchema.safeParse(readJson(file));
    if (!parsed.success) {
      errors.push({
        file: rel(file),
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
      continue;
    }
    const mockTest = parsed.data;
    if (mockTests.some((t) => t.code === mockTest.code)) {
      dupMockTestCodes.add(mockTest.code);
    }
    if (seenBlueprintCodes.has(mockTest.blueprint.code)) {
      dupBlueprintCodes.add(mockTest.blueprint.code);
    }
    seenBlueprintCodes.add(mockTest.blueprint.code);
    for (const s of mockTest.sections) {
      if (s.listeningPassageCode && !listeningCodes.has(s.listeningPassageCode)) {
        errors.push({
          file: rel(file),
          message: `listeningPassageCode "${s.listeningPassageCode}" tidak ditemukan`,
        });
      }
      if (s.readingPassageCode && !readingCodes.has(s.readingPassageCode)) {
        errors.push({
          file: rel(file),
          message: `readingPassageCode "${s.readingPassageCode}" tidak ditemukan`,
        });
      }
    }
    mockTests.push(mockTest);
  }
  for (const code of dupMockTestCodes) {
    errors.push({ file: "tryout/", message: `Kode mock test duplikat: ${code}` });
  }
  for (const code of dupBlueprintCodes) {
    errors.push({ file: "tryout/", message: `Kode test blueprint duplikat: ${code}` });
  }

  return {
    ok: errors.length === 0,
    errors,
    topics,
    coursePaths,
    modules,
    lessons,
    listeningPassages,
    readingPassages,
    writingTasks,
    speakingPrompts,
    mockTests,
  };
}
