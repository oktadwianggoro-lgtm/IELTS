"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/log";
import type { Role } from "@prisma/client";

export type ChangeRoleResult = { error?: string } | null;

/**
 * ADMIN-only — "guru tidak boleh otomatis mendapat akses admin penuh"
 * (Master Prompt §11): a TEACHER can review/publish content (see
 * app/(admin)/admin/content/[code]/actions.ts) but changing ANYONE's
 * role, including promoting another account to TEACHER/ADMIN, is
 * reserved for ADMIN.
 */
export async function changeUserRoleAction(
  targetUserId: string,
  newRole: Role,
): Promise<ChangeRoleResult> {
  const actor = await requireRole(["ADMIN"]);

  if (targetUserId === actor.id) {
    return { error: "Tidak bisa mengubah peran akun sendiri." };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "Pengguna tidak ditemukan." };
  if (target.role === newRole) return null;

  await prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } });
  await logAuditEvent(actor.id, "user_role_change", "User", targetUserId, {
    email: target.email,
    oldRole: target.role,
    newRole,
  });

  revalidatePath("/admin/users");
  return null;
}
