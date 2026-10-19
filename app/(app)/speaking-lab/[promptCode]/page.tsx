import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpeakingPromptWorkspace } from "@/components/speaking/speaking-prompt-workspace";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { PEDAGOGICAL_LEVEL_LABEL, SPEAKING_PART_LABEL } from "@/lib/content/labels";

export default async function SpeakingPromptPage({
  params,
}: {
  params: Promise<{ promptCode: string }>;
}) {
  const user = await requireUser();
  const { promptCode } = await params;

  const prompt = await prisma.speakingPrompt.findUnique({ where: { code: promptCode } });
  if (!prompt || prompt.reviewStatus !== "PUBLISHED") notFound();

  const latestSubmission = await prisma.speakingSubmission.findFirst({
    where: { userId: user.id, speakingPromptId: prompt.id },
    orderBy: { createdAt: "desc" },
    include: { recording: true },
  });

  // Same D-021/D-034/D-035 principle as every other lab: model
  // answer/checklist only ever leave the server once this attempt is
  // actually COMPLETED.
  const revealed = latestSubmission?.status === "COMPLETED";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <nav className="text-muted-foreground flex items-center gap-1 text-xs">
        <Link href="/speaking-lab" className="hover:underline">
          Speaking Lab
        </Link>
        <span>/</span>
        <span>{prompt.title}</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{prompt.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{SPEAKING_PART_LABEL[prompt.part]}</Badge>
          <Badge variant="outline">{PEDAGOGICAL_LEVEL_LABEL[prompt.level]}</Badge>
          {prompt.prepSeconds > 0 ? (
            <Badge variant="outline">{prompt.prepSeconds}s persiapan</Badge>
          ) : null}
          <Badge variant="outline">{prompt.responseSeconds}s bicara</Badge>
        </CardContent>
      </Card>

      <SpeakingPromptWorkspace
        promptCode={prompt.code}
        promptText={prompt.promptText}
        cueCardPoints={prompt.cueCardPoints as string[] | null}
        followUpQuestions={prompt.followUpQuestions as string[]}
        prepSeconds={prompt.prepSeconds}
        responseSeconds={prompt.responseSeconds}
        initialSubmission={
          latestSubmission
            ? {
                id: latestSubmission.id,
                status: latestSubmission.status,
                fallbackText: latestSubmission.fallbackText ?? "",
                recording: latestSubmission.recording
                  ? {
                      id: latestSubmission.recording.id,
                      mimeType: latestSubmission.recording.mimeType,
                    }
                  : null,
                selfAssessment:
                  (latestSubmission.selfAssessment as Record<string, boolean> | null) ?? null,
              }
            : null
        }
        revealedModelAnswer={revealed ? prompt.modelAnswer : null}
        revealedChecklist={revealed ? (prompt.checklistItems as string[]) : null}
      />
    </div>
  );
}
