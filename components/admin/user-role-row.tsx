"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeUserRoleAction } from "@/app/(admin)/admin/users/actions";
import type { Role } from "@prisma/client";

const ROLE_LABEL: Record<Role, string> = { STUDENT: "Siswa", TEACHER: "Guru", ADMIN: "Admin" };

export function UserRoleRow({
  user,
  isSelf,
}: {
  user: { id: string; name: string | null; email: string; role: Role; emailVerified: Date | null };
  isSelf: boolean;
}) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string | null) {
    if (!next) return;
    const newRole = next as Role;
    const previous = role;
    setRole(newRole);
    setSaving(true);
    setError(null);
    changeUserRoleAction(user.id, newRole)
      .then((result) => {
        if (result?.error) {
          setError(result.error);
          setRole(previous);
        }
      })
      .finally(() => setSaving(false));
  }

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0">
      <div>
        <p className="font-medium">{user.name ?? "—"}</p>
        <p className="text-muted-foreground text-xs">{user.email}</p>
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {!user.emailVerified ? (
          <Badge variant="outline" className="text-xs">
            Belum verifikasi
          </Badge>
        ) : null}
        {isSelf ? (
          <Badge variant="secondary">{ROLE_LABEL[role]} (Anda)</Badge>
        ) : (
          <Select value={role} onValueChange={handleChange} disabled={saving}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
