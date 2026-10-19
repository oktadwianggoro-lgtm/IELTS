import "server-only";
import { prisma } from "@/lib/db";

/**
 * Append-only audit trail for sensitive admin mutations (Master Prompt
 * §11: "Audit log untuk tindakan sensitif admin"). Never updated or
 * deleted by application code — call this, don't touch the table
 * directly, so every sensitive action is logged the same way.
 */
export async function logAuditEvent(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata: (metadata ?? undefined) as object },
  });
}
