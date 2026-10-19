-- CreateEnum
CREATE TYPE "ReadingExamType" AS ENUM ('ACADEMIC', 'GENERAL_TRAINING');

-- AlterEnum
ALTER TYPE "AttemptSource" ADD VALUE 'READING_PRACTICE';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "evidence" TEXT,
ADD COLUMN     "readingPassageId" TEXT,
ADD COLUMN     "wordLimit" INTEGER;

-- CreateTable
CREATE TABLE "reading_passages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "examType" "ReadingExamType" NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "topic" TEXT NOT NULL,
    "paragraphs" JSONB NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL DEFAULT 'original',
    "sourceNotes" TEXT,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_passages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reading_passages_code_key" ON "reading_passages"("code");

-- CreateIndex
CREATE INDEX "reading_passages_reviewStatus_idx" ON "reading_passages"("reviewStatus");

-- CreateIndex
CREATE INDEX "questions_readingPassageId_idx" ON "questions"("readingPassageId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_readingPassageId_fkey" FOREIGN KEY ("readingPassageId") REFERENCES "reading_passages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_passages" ADD CONSTRAINT "reading_passages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_passages" ADD CONSTRAINT "reading_passages_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
