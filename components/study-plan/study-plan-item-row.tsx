"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markStudyPlanItemDoneAction } from "@/app/(app)/rencana-belajar/actions";

export function StudyPlanItemRow({
  itemId,
  href,
  title,
  skillLabel,
  estimatedMinutes,
  reason,
  status,
}: {
  itemId: string;
  href: string;
  title: string;
  skillLabel: string;
  estimatedMinutes: number;
  reason: string | null;
  status: "PENDING" | "DONE" | "SKIPPED";
}) {
  const [pending, startTransition] = useTransition();
  const done = status === "DONE";

  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-medium hover:underline">
          {title}
        </Link>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <Badge variant="outline">{skillLabel}</Badge>
          <span>{estimatedMinutes} menit</span>
          {reason ? <span>· {reason}</span> : null}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant={done ? "secondary" : "outline"}
        disabled={done || pending}
        onClick={() => startTransition(() => markStudyPlanItemDoneAction(itemId))}
      >
        <Check className="h-4 w-4" />
        {done ? "Selesai" : "Tandai"}
      </Button>
    </div>
  );
}
