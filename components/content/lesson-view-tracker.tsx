"use client";

import { useEffect } from "react";
import { markLessonInProgressAction } from "@/app/(app)/materi/actions";

/** Fires once per page view to record "the student opened this lesson" —
 * kept as a tiny client effect rather than a mutation during RSC render. */
export function LessonViewTracker({ lessonCode }: { lessonCode: string }) {
  useEffect(() => {
    markLessonInProgressAction(lessonCode).catch(() => undefined);
  }, [lessonCode]);
  return null;
}
