"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ContentActionState } from "@/app/(admin)/admin/content/[code]/actions";
import type { ContentStatus } from "@prisma/client";

const ACTIONS: Record<
  ContentStatus,
  { to: ContentStatus; label: string; variant?: "outline" | "default" }[]
> = {
  DRAFT: [{ to: "IN_REVIEW", label: "Kirim untuk Review" }],
  IN_REVIEW: [
    { to: "DRAFT", label: "Kembalikan ke Draft", variant: "outline" },
    { to: "APPROVED", label: "Setujui" },
  ],
  APPROVED: [
    { to: "DRAFT", label: "Kembalikan ke Draft", variant: "outline" },
    { to: "PUBLISHED", label: "Terbitkan" },
  ],
  PUBLISHED: [{ to: "ARCHIVED", label: "Arsipkan", variant: "outline" }],
  ARCHIVED: [{ to: "DRAFT", label: "Kembalikan ke Draft", variant: "outline" }],
};

export function StatusTransitionButtons({
  code,
  currentStatus,
  onTransition,
}: {
  code: string;
  currentStatus: ContentStatus;
  onTransition: (code: string, targetStatus: ContentStatus) => Promise<ContentActionState>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.to}
            type="button"
            variant={action.variant ?? "default"}
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await onTransition(code, action.to);
                if (result?.error) setError(result.error);
              });
            }}
          >
            {pending ? "Memproses..." : action.label}
          </Button>
        ))}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
