import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// Server-only, outside public/ — never served by a static route. The only
// way to read a recording is the ownership-checked route handler at
// app/api/speaking-recordings/[id] (Master Prompt §8.8 "Lindungi file
// rekaman"). Not committed to git — see .gitignore.
const STORAGE_ROOT = join(process.cwd(), "storage", "speaking-recordings");

function extensionFor(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac"))
    return "m4a";
  if (mimeType.includes("wav")) return "wav";
  return "bin";
}

/** Writes a recording under a per-user subdirectory and returns the
 * storage key (relative to STORAGE_ROOT, always forward-slash so it stays
 * portable across OSes) to persist on the DB row. */
export async function saveRecording(
  userId: string,
  mimeType: string,
  data: Buffer,
): Promise<string> {
  const dir = join(STORAGE_ROOT, userId);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extensionFor(mimeType)}`;
  await writeFile(join(dir, filename), data);
  return `${userId}/${filename}`;
}

export async function readRecording(storageKey: string): Promise<Buffer> {
  return readFile(join(STORAGE_ROOT, storageKey));
}

export async function deleteRecording(storageKey: string): Promise<void> {
  await unlink(join(STORAGE_ROOT, storageKey)).catch(() => {});
}
