-- CreateEnum
CREATE TYPE "SpeakingPart" AS ENUM ('PART1', 'PART2', 'PART3');

-- CreateEnum
CREATE TYPE "SpeakingSubmissionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "speaking_prompts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "part" "SpeakingPart" NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "topic" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "cueCardPoints" JSONB,
    "followUpQuestions" JSONB NOT NULL DEFAULT '[]',
    "prepSeconds" INTEGER NOT NULL,
    "responseSeconds" INTEGER NOT NULL,
    "modelAnswer" TEXT NOT NULL,
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

    CONSTRAINT "speaking_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_recordings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speaking_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speakingPromptId" TEXT NOT NULL,
    "recordingId" TEXT,
    "fallbackText" TEXT,
    "status" "SpeakingSubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "selfAssessment" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speaking_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "speaking_prompts_code_key" ON "speaking_prompts"("code");

-- CreateIndex
CREATE INDEX "speaking_prompts_reviewStatus_idx" ON "speaking_prompts"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_submissions_recordingId_key" ON "speaking_submissions"("recordingId");

-- CreateIndex
CREATE INDEX "speaking_submissions_userId_speakingPromptId_idx" ON "speaking_submissions"("userId", "speakingPromptId");

-- AddForeignKey
ALTER TABLE "speaking_prompts" ADD CONSTRAINT "speaking_prompts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_prompts" ADD CONSTRAINT "speaking_prompts_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_recordings" ADD CONSTRAINT "speaking_recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_speakingPromptId_fkey" FOREIGN KEY ("speakingPromptId") REFERENCES "speaking_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "speaking_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
