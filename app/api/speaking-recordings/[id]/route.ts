import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { readRecording } from "@/lib/speaking/storage";

/** The only way to read a recording's bytes — never a public/ static path.
 * Master Prompt §8.8: "Lindungi file rekaman". */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const recording = await prisma.speakingRecording.findUnique({ where: { id } });
  if (!recording || recording.userId !== session.user.id) {
    return NextResponse.json({ error: "Rekaman tidak ditemukan." }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readRecording(recording.storageKey);
  } catch {
    return NextResponse.json({ error: "File rekaman tidak ditemukan di server." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": recording.mimeType,
      "Content-Length": String(recording.sizeBytes),
      "Cache-Control": "private, no-store",
    },
  });
}
