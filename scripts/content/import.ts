import "dotenv/config";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadContent } from "../../lib/content/loader";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Counts = { created: number; updated: number };
function bump(counts: Counts, wasCreate: boolean) {
  if (wasCreate) counts.created++;
  else counts.updated++;
}

async function main() {
  const contentRoot = join(process.cwd(), "content");
  const result = loadContent(contentRoot);

  if (!result.ok) {
    console.error(`[content:import] Dibatalkan — ${result.errors.length} file tidak valid:\n`);
    for (const err of result.errors) {
      console.error(`  ✗ ${err.file}\n    ${err.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const topicCounts: Counts = { created: 0, updated: 0 };
  const coursePathCounts: Counts = { created: 0, updated: 0 };
  const moduleCounts: Counts = { created: 0, updated: 0 };
  const lessonCounts: Counts = { created: 0, updated: 0 };
  const questionCounts: Counts = { created: 0, updated: 0 };
  const listeningPassageCounts: Counts = { created: 0, updated: 0 };
  const readingPassageCounts: Counts = { created: 0, updated: 0 };
  const writingTaskCounts: Counts = { created: 0, updated: 0 };
  const speakingPromptCounts: Counts = { created: 0, updated: 0 };

  // ---- topics ----
  const topicIdByCode = new Map<string, string>();
  for (const t of result.topics) {
    const existing = await prisma.topic.findUnique({ where: { code: t.code } });
    const row = await prisma.topic.upsert({
      where: { code: t.code },
      update: { name: t.name, skill: t.skill ?? null },
      create: { code: t.code, name: t.name, skill: t.skill ?? null },
    });
    bump(topicCounts, !existing);
    topicIdByCode.set(t.code, row.id);
  }

  // ---- course paths ----
  const coursePathIdByCode = new Map<string, string>();
  for (const cp of result.coursePaths) {
    const existing = await prisma.coursePath.findUnique({ where: { code: cp.code } });
    const row = await prisma.coursePath.upsert({
      where: { code: cp.code },
      update: { title: cp.title, description: cp.description, order: cp.order },
      create: { code: cp.code, title: cp.title, description: cp.description, order: cp.order },
    });
    bump(coursePathCounts, !existing);
    coursePathIdByCode.set(cp.code, row.id);
  }

  // ---- modules ----
  const moduleIdByCode = new Map<string, string>();
  for (const m of result.modules) {
    const coursePathId = coursePathIdByCode.get(m.coursePathCode)!;
    const existing = await prisma.module.findUnique({ where: { code: m.code } });
    const row = await prisma.module.upsert({
      where: { code: m.code },
      update: {
        title: m.title,
        description: m.description,
        level: m.level,
        skill: m.skill,
        order: m.order,
        coursePathId,
      },
      create: {
        code: m.code,
        title: m.title,
        description: m.description,
        level: m.level,
        skill: m.skill,
        order: m.order,
        coursePathId,
      },
    });
    bump(moduleCounts, !existing);
    moduleIdByCode.set(m.code, row.id);
  }

  // ---- lessons (pass 1: upsert core fields + topics) ----
  const lessonIdByCode = new Map<string, string>();
  for (const l of result.lessons) {
    const moduleId = moduleIdByCode.get(l.moduleCode)!;
    const existing = await prisma.lesson.findUnique({ where: { code: l.code } });
    const data = {
      title: l.title,
      level: l.level,
      skill: l.skill,
      targetBandRange: l.targetBandRange,
      estimatedMinutes: l.estimatedMinutes,
      order: l.order,
      objectives: l.objectives,
      content: l.content,
      sourceNotes: l.sourceNotes,
      moduleId,
    };
    const row = existing
      ? await prisma.lesson.update({
          where: { code: l.code },
          data: { ...data, contentVersion: { increment: 1 } },
        })
      : await prisma.lesson.create({ data: { ...data, code: l.code } });
    bump(lessonCounts, !existing);
    lessonIdByCode.set(l.code, row.id);

    await prisma.lessonTopic.deleteMany({ where: { lessonId: row.id } });
    for (const topicCode of l.topics) {
      await prisma.lessonTopic.create({
        data: { lessonId: row.id, topicId: topicIdByCode.get(topicCode)! },
      });
    }
  }

  // ---- lessons (pass 2: prerequisites, now that every lesson has an id) ----
  for (const l of result.lessons) {
    const lessonId = lessonIdByCode.get(l.code)!;
    await prisma.lessonPrerequisite.deleteMany({ where: { lessonId } });
    for (const prereqCode of l.prerequisites) {
      await prisma.lessonPrerequisite.create({
        data: { lessonId, prerequisiteLessonId: lessonIdByCode.get(prereqCode)! },
      });
    }
  }

  // ---- questions ----
  for (const l of result.lessons) {
    const lessonId = lessonIdByCode.get(l.code)!;
    for (const q of l.questions) {
      const existing = await prisma.question.findUnique({ where: { code: q.code } });
      const data = {
        type: q.type,
        skill: q.skill ?? l.skill,
        level: q.level ?? l.level,
        targetBandRange: q.targetBandRange ?? l.targetBandRange,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options ?? undefined,
        answerKey: q.answerKey,
        acceptedAnswers: q.acceptedAnswers ?? undefined,
        explanation: q.explanation,
        evidence: q.evidence,
        wordLimit: q.wordLimit,
        estimatedSeconds: q.estimatedSeconds,
        sourceType: q.sourceType,
        lessonId,
      };
      const row = existing
        ? await prisma.question.update({
            where: { code: q.code },
            data: { ...data, contentVersion: { increment: 1 } },
          })
        : await prisma.question.create({ data: { ...data, code: q.code } });
      bump(questionCounts, !existing);

      await prisma.questionTopic.deleteMany({ where: { questionId: row.id } });
      for (const topicCode of q.topics) {
        await prisma.questionTopic.create({
          data: { questionId: row.id, topicId: topicIdByCode.get(topicCode)! },
        });
      }
    }
  }

  // ---- listening passages (+ their own questions) ----
  for (const p of result.listeningPassages) {
    const existing = await prisma.listeningPassage.findUnique({ where: { code: p.code } });
    const data = {
      title: p.title,
      section: p.section,
      level: p.level,
      accent: p.accent,
      difficulty: p.difficulty,
      audioUrl: `/audio/listening/${p.audioFile}`,
      durationSeconds: p.durationSeconds,
      script: p.script,
      sourceNotes: p.sourceNotes,
    };
    const row = existing
      ? await prisma.listeningPassage.update({
          where: { code: p.code },
          data: { ...data, contentVersion: { increment: 1 } },
        })
      : await prisma.listeningPassage.create({ data: { ...data, code: p.code } });
    bump(listeningPassageCounts, !existing);

    for (const q of p.questions) {
      const existingQ = await prisma.question.findUnique({ where: { code: q.code } });
      const qData = {
        type: q.type,
        skill: q.skill ?? ("LISTENING" as const),
        level: q.level ?? p.level,
        targetBandRange: q.targetBandRange,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options ?? undefined,
        answerKey: q.answerKey,
        acceptedAnswers: q.acceptedAnswers ?? undefined,
        explanation: q.explanation,
        evidence: q.evidence,
        wordLimit: q.wordLimit,
        estimatedSeconds: q.estimatedSeconds,
        sourceType: q.sourceType,
        listeningPassageId: row.id,
      };
      const qRow = existingQ
        ? await prisma.question.update({
            where: { code: q.code },
            data: { ...qData, contentVersion: { increment: 1 } },
          })
        : await prisma.question.create({ data: { ...qData, code: q.code } });
      bump(questionCounts, !existingQ);

      await prisma.questionTopic.deleteMany({ where: { questionId: qRow.id } });
      for (const topicCode of q.topics) {
        await prisma.questionTopic.create({
          data: { questionId: qRow.id, topicId: topicIdByCode.get(topicCode)! },
        });
      }
    }
  }

  // ---- reading passages (+ their own questions) ----
  for (const p of result.readingPassages) {
    const existing = await prisma.readingPassage.findUnique({ where: { code: p.code } });
    const data = {
      title: p.title,
      examType: p.examType,
      level: p.level,
      topic: p.topic,
      paragraphs: p.paragraphs,
      wordCount: p.paragraphs.reduce((n, para) => n + para.text.split(/\s+/).length, 0),
      sourceNotes: p.sourceNotes,
    };
    const row = existing
      ? await prisma.readingPassage.update({
          where: { code: p.code },
          data: { ...data, contentVersion: { increment: 1 } },
        })
      : await prisma.readingPassage.create({ data: { ...data, code: p.code } });
    bump(readingPassageCounts, !existing);

    for (const q of p.questions) {
      const existingQ = await prisma.question.findUnique({ where: { code: q.code } });
      const qData = {
        type: q.type,
        skill: q.skill ?? ("READING" as const),
        level: q.level ?? p.level,
        targetBandRange: q.targetBandRange,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options ?? undefined,
        answerKey: q.answerKey,
        acceptedAnswers: q.acceptedAnswers ?? undefined,
        explanation: q.explanation,
        evidence: q.evidence,
        wordLimit: q.wordLimit,
        estimatedSeconds: q.estimatedSeconds,
        sourceType: q.sourceType,
        readingPassageId: row.id,
      };
      const qRow = existingQ
        ? await prisma.question.update({
            where: { code: q.code },
            data: { ...qData, contentVersion: { increment: 1 } },
          })
        : await prisma.question.create({ data: { ...qData, code: q.code } });
      bump(questionCounts, !existingQ);

      await prisma.questionTopic.deleteMany({ where: { questionId: qRow.id } });
      for (const topicCode of q.topics) {
        await prisma.questionTopic.create({
          data: { questionId: qRow.id, topicId: topicIdByCode.get(topicCode)! },
        });
      }
    }
  }

  // ---- writing tasks ----
  for (const t of result.writingTasks) {
    const existing = await prisma.writingTask.findUnique({ where: { code: t.code } });
    const data = {
      title: t.title,
      taskType: t.taskType,
      level: t.level,
      prompt: t.prompt,
      visualData: t.visualData ?? undefined,
      minWords: t.minWords,
      suggestedMinutes: t.suggestedMinutes,
      sampleAnswer: t.sampleAnswer,
      checklistItems: t.checklistItems,
      sourceNotes: t.sourceNotes,
    };
    if (existing) {
      await prisma.writingTask.update({
        where: { code: t.code },
        data: { ...data, contentVersion: { increment: 1 } },
      });
      bump(writingTaskCounts, false);
    } else {
      await prisma.writingTask.create({ data: { ...data, code: t.code } });
      bump(writingTaskCounts, true);
    }
  }

  // ---- speaking prompts ----
  for (const p of result.speakingPrompts) {
    const existing = await prisma.speakingPrompt.findUnique({ where: { code: p.code } });
    const data = {
      title: p.title,
      part: p.part,
      level: p.level,
      topic: p.topic,
      promptText: p.promptText,
      cueCardPoints: p.cueCardPoints ?? undefined,
      followUpQuestions: p.followUpQuestions,
      prepSeconds: p.prepSeconds,
      responseSeconds: p.responseSeconds,
      modelAnswer: p.modelAnswer,
      checklistItems: p.checklistItems,
      sourceNotes: p.sourceNotes,
    };
    if (existing) {
      await prisma.speakingPrompt.update({
        where: { code: p.code },
        data: { ...data, contentVersion: { increment: 1 } },
      });
      bump(speakingPromptCounts, false);
    } else {
      await prisma.speakingPrompt.create({ data: { ...data, code: p.code } });
      bump(speakingPromptCounts, true);
    }
  }

  const summary = (label: string, c: Counts) =>
    `  ${label}: ${c.created} baru, ${c.updated} diperbarui`;
  console.log("[content:import] Selesai.");
  console.log(summary("Topics", topicCounts));
  console.log(summary("Course paths", coursePathCounts));
  console.log(summary("Modules", moduleCounts));
  console.log(summary("Lessons", lessonCounts));
  console.log(summary("Questions", questionCounts));
  console.log(summary("Listening passages", listeningPassageCounts));
  console.log(summary("Reading passages", readingPassageCounts));
  console.log(summary("Writing tasks", writingTaskCounts));
  console.log(summary("Speaking prompts", speakingPromptCounts));
  console.log(
    "\nSemua konten yang baru dibuat/diperbarui berstatus DRAFT. Gunakan CMS admin untuk meninjau dan menerbitkan.",
  );
}

main()
  .catch((error) => {
    console.error("[content:import] Gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
