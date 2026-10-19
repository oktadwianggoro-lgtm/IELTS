-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudyPlanItemStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "diagnostic_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DiagnosticStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "estimatedLevel" "PedagogicalLevel",
    "confidence" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "diagnostic_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_estimates" (
    "id" TEXT NOT NULL,
    "diagnosticResultId" TEXT NOT NULL,
    "skill" "SkillArea" NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "scorePercent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "skill_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_answers" (
    "id" TEXT NOT NULL,
    "diagnosticResultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "submitted" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetOverallBand" DOUBLE PRECISION,
    "testDate" TIMESTAMP(3),
    "dailyStudyMinutes" "DailyStudyMinutes" NOT NULL,
    "generatedFromDiagnosticId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_items" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "StudyPlanItemStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diagnostic_results_userId_idx" ON "diagnostic_results"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_estimates_diagnosticResultId_skill_key" ON "skill_estimates"("diagnosticResultId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_answers_diagnosticResultId_questionId_key" ON "diagnostic_answers"("diagnosticResultId", "questionId");

-- CreateIndex
CREATE INDEX "study_plans_userId_isActive_idx" ON "study_plans"("userId", "isActive");

-- CreateIndex
CREATE INDEX "study_plan_items_studyPlanId_idx" ON "study_plan_items"("studyPlanId");

-- AddForeignKey
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_estimates" ADD CONSTRAINT "skill_estimates_diagnosticResultId_fkey" FOREIGN KEY ("diagnosticResultId") REFERENCES "diagnostic_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_answers" ADD CONSTRAINT "diagnostic_answers_diagnosticResultId_fkey" FOREIGN KEY ("diagnosticResultId") REFERENCES "diagnostic_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_answers" ADD CONSTRAINT "diagnostic_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_generatedFromDiagnosticId_fkey" FOREIGN KEY ("generatedFromDiagnosticId") REFERENCES "diagnostic_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
