import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { CreateMockTestForm } from "@/components/admin/create-mock-test-form";

export default async function NewMockTestPage() {
  await requireRole(["ADMIN", "TEACHER"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Mock Test Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateMockTestForm />
        </CardContent>
      </Card>
    </div>
  );
}
