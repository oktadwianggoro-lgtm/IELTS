"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  markLessonCompleteAction,
  saveNoteAction,
  toggleBookmarkAction,
} from "@/app/(app)/materi/actions";

export function LessonActions({
  lessonCode,
  initialBookmarked,
  initialNote,
  initialCompleted,
}: {
  lessonCode: string;
  initialBookmarked: boolean;
  initialNote: string;
  initialCompleted: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [note, setNote] = useState(initialNote);
  const [noteSaved, setNoteSaved] = useState(true);
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Progress Anda</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await toggleBookmarkAction(lessonCode);
                setBookmarked(result.bookmarked);
              })
            }
          >
            {bookmarked ? (
              <>
                <BookmarkCheck className="h-4 w-4" /> Tersimpan
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" /> Simpan
              </>
            )}
          </Button>
          <Button
            type="button"
            variant={completed ? "secondary" : "default"}
            size="sm"
            disabled={pending || completed}
            onClick={() =>
              startTransition(async () => {
                await markLessonCompleteAction(lessonCode);
                setCompleted(true);
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            {completed ? "Selesai" : "Tandai Selesai"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <label htmlFor="lesson-note" className="text-muted-foreground text-xs">
          Catatan pribadi (hanya Anda yang bisa melihat)
        </label>
        <textarea
          id="lesson-note"
          className="border-border bg-background mt-1 w-full rounded-md border p-2 text-sm"
          rows={3}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteSaved(false);
          }}
          onBlur={() =>
            startTransition(async () => {
              await saveNoteAction(lessonCode, note);
              setNoteSaved(true);
            })
          }
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {noteSaved ? "Tersimpan" : "Menyimpan..."}
        </p>
      </CardContent>
    </Card>
  );
}
