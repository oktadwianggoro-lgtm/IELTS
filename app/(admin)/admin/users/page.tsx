import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { UserRoleRow } from "@/components/admin/user-role-row";

export default async function AdminUsersPage() {
  const actor = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, emailVerified: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {users.map((u) => (
            <UserRoleRow key={u.id} user={u} isSelf={u.id === actor.id} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
