-- CreateEnum
CREATE TYPE "WritingTaskType" AS ENUM ('TASK1_ACADEMIC', 'TASK1_GENERAL_TRAINING', 'TASK2');

-- CreateEnum
CREATE TYPE "WritingSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "writing_tasks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taskType" "WritingTaskType" NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "prompt" TEXT NOT NULL,
    "visualData" JSONB,
    "minWords" INTEGER NOT NULL,
    "suggestedMinutes" INTEGER NOT NULL,
    "sampleAnswer" TEXT NOT NULL,
    "checklistItems" JSONB NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL DEFAULT 'original',
    "sourceNotes" TEXT,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "writingTaskId" TEXT NOT NULL,
    "outline" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "draftHistory" JSONB NOT NULL DEFAULT '[]',
    "status" "WritingSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "selfAssessment" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "writing_tasks_code_key" ON "writing_tasks"("code");

-- CreateIndex
CREATE INDEX "writing_tasks_reviewStatus_idx" ON "writing_tasks"("reviewStatus");

-- CreateIndex
CREATE INDEX "writing_submissions_userId_writingTaskId_idx" ON "writing_submissions"("userId", "writingTaskId");

-- AddForeignKey
ALTER TABLE "writing_tasks" ADD CONSTRAINT "writing_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_tasks" ADD CONSTRAINT "writing_tasks_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_writingTaskId_fkey" FOREIGN KEY ("writingTaskId") REFERENCES "writing_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
