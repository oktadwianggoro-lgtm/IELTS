import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const ACTION_LABEL: Record<string, string> = {
  content_status_transition: "Transisi status konten",
  user_role_change: "Perubahan peran pengguna",
  question_report_resolved: "Laporan soal diselesaikan",
  mock_test_created: "Mock test dibuat",
  mock_test_section_updated: "Section mock test diubah",
};

export default async function AdminAuditLogPage() {
  await requireRole(["ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada tindakan sensitif tercatat.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="border-border space-y-1 border-b pb-2 text-sm last:border-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{ACTION_LABEL[log.action] ?? log.action}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {log.createdAt.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {log.actor.name ?? log.actor.email} · {log.entityType} {log.entityId}
                </p>
                {log.metadata ? (
                  <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
