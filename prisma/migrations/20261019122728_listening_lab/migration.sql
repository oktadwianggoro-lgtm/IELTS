-- CreateEnum
CREATE TYPE "ListeningSection" AS ENUM ('SECTION_1', 'SECTION_2', 'SECTION_3', 'SECTION_4');

-- AlterEnum
ALTER TYPE "AttemptSource" ADD VALUE 'LISTENING_PRACTICE';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "listeningPassageId" TEXT;

-- CreateTable
CREATE TABLE "listening_passages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section" "ListeningSection" NOT NULL,
    "level" "PedagogicalLevel" NOT NULL,
    "accent" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "audioUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "script" JSONB NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "reviewStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" TEXT NOT NULL DEFAULT 'original',
    "createdById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listening_passages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listening_passages_code_key" ON "listening_passages"("code");

-- CreateIndex
CREATE INDEX "listening_passages_reviewStatus_idx" ON "listening_passages"("reviewStatus");

-- CreateIndex
CREATE INDEX "questions_listeningPassageId_idx" ON "questions"("listeningPassageId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_listeningPassageId_fkey" FOREIGN KEY ("listeningPassageId") REFERENCES "listening_passages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_passages" ADD CONSTRAINT "listening_passages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_passages" ADD CONSTRAINT "listening_passages_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
