import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

/**
 * A Route Handler, not a Server Action — same reasoning as
 * app/api/auth-signout/route.ts: this mutates auth state (deletes the
 * signed-in user, then signs out) and is invoked from the authenticated
 * /profil page. A Server Action posting to /profil would have Next.js
 * auto-re-render /profil's Server Components as part of completing the
 * action, using the request's original cookies — racing signOut()'s own
 * cookie-clearing within the same response (D-036/D-042).
 *
 * Content-authorship relations (Lesson.reviewedBy, Question.createdBy/
 * reviewedBy, etc.) have no onDelete rule, so Postgres rejects the delete
 * with a foreign-key error for any ADMIN/TEACHER who has authored or
 * reviewed content — surfaced here as a clear message rather than a crash,
 * since that's real, intentional content that must not silently disappear
 * with its author.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const body = (await request.json().catch(() => null)) as { confirmationEmail?: unknown } | null;
  const confirmationEmail = typeof body?.confirmationEmail === "string" ? body.confirmationEmail : "";

  if (confirmationEmail.trim().toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: "Email konfirmasi tidak cocok." }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: user.id } });
  } catch {
    return NextResponse.json(
      {
        error:
          "Akun tidak dapat dihapus karena masih memiliki konten (lesson/soal) yang Anda buat atau tinjau. Pindahkan kepemilikan konten tersebut ke admin lain terlebih dahulu.",
      },
      { status: 409 },
    );
  }

  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
