-- CreateEnum
CREATE TYPE "AttemptSource" AS ENUM ('ADAPTIVE_PRACTICE', 'MISTAKE_REVIEW');

-- CreateEnum
CREATE TYPE "ErrorReason" AS ENUM ('VOCAB_UNKNOWN', 'MISUNDERSTOOD_INSTRUCTION', 'MISSED_DETAIL', 'GRAMMAR', 'WRONG_STRATEGY', 'RUSHED', 'TYPO');

-- CreateTable
CREATE TABLE "question_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "source" "AttemptSource" NOT NULL,
    "submitted" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mistake_book_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "lastSubmittedAnswer" JSONB NOT NULL,
    "errorReason" "ErrorReason",
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstMissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "mistake_book_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_attempts_userId_questionId_idx" ON "question_attempts"("userId", "questionId");

-- CreateIndex
CREATE INDEX "question_attempts_userId_attemptedAt_idx" ON "question_attempts"("userId", "attemptedAt");

-- CreateIndex
CREATE INDEX "mistake_book_entries_userId_nextReviewAt_idx" ON "mistake_book_entries"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "mistake_book_entries_userId_questionId_key" ON "mistake_book_entries"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistake_book_entries" ADD CONSTRAINT "mistake_book_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistake_book_entries" ADD CONSTRAINT "mistake_book_entries_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
