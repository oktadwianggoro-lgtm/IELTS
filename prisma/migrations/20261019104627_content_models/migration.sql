-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillArea" AS ENUM ('LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION', 'TEST_STRATEGY');

-- CreateEnum
CREATE TYPE "PedagogicalLevel" AS ENUM ('STARTER', 'A1', 'A2', 'B1', 'B2', 'C1_ENRICHMENT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'GAP_FILL', 'MATCHING', 'ORDERING', 'SHORT_ANSWER', 'TRUE_FALSE_NOT_GIVEN', 'YES_NO_NOT_GIVEN', 'SENTENCE_TRANSFORMATION', 'ERROR_CORRECTION', 'SUMMARY_COMPLETION');

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill" "SkillArea",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_paths" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coursePathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "PedagogicalLevel" NOT NULL,
    "skill" "SkillArea" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "skill" "SkillArea" NOT NULL,
    "targetBandRange" TEXT,
    "estimatedMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "objectives" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "sourceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_prerequisites" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "prerequisiteLessonId" TEXT NOT NULL,

    CONSTRAINT "lesson_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_topics" (
    "lessonId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "lesson_topics_pkey" PRIMARY KEY ("lessonId","topicId")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lessonId" TEXT,
    "type" "QuestionType" NOT NULL,
    "skill" "SkillArea" NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "targetBandRange" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "prompt" JSONB NOT NULL,
    "options" JSONB,
    "answerKey" JSONB NOT NULL,
    "acceptedAnswers" JSONB,
    "explanation" TEXT NOT NULL,
    "estimatedSeconds" INTEGER,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL DEFAULT 'original',
    "createdById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_topics" (
    "questionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "question_topics_pkey" PRIMARY KEY ("questionId","topicId")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_code_key" ON "topics"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_paths_code_key" ON "course_paths"("code");

-- CreateIndex
CREATE UNIQUE INDEX "modules_code_key" ON "modules"("code");

-- CreateIndex
CREATE INDEX "modules_coursePathId_idx" ON "modules"("coursePathId");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_code_key" ON "lessons"("code");

-- CreateIndex
CREATE INDEX "lessons_moduleId_idx" ON "lessons"("moduleId");

-- CreateIndex
CREATE INDEX "lessons_reviewStatus_idx" ON "lessons"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_prerequisites_lessonId_prerequisiteLessonId_key" ON "lesson_prerequisites"("lessonId", "prerequisiteLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_code_key" ON "questions"("code");

-- CreateIndex
CREATE INDEX "questions_lessonId_idx" ON "questions"("lessonId");

-- CreateIndex
CREATE INDEX "questions_reviewStatus_idx" ON "questions"("reviewStatus");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_coursePathId_fkey" FOREIGN KEY ("coursePathId") REFERENCES "course_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_prerequisites" ADD CONSTRAINT "lesson_prerequisites_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_prerequisites" ADD CONSTRAINT "lesson_prerequisites_prerequisiteLessonId_fkey" FOREIGN KEY ("prerequisiteLessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_topics" ADD CONSTRAINT "lesson_topics_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_topics" ADD CONSTRAINT "lesson_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topics" ADD CONSTRAINT "question_topics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_topics" ADD CONSTRAINT "question_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
