import "server-only";

type QuestionOption = { id: string; text: string };

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function stringMatches(
  submitted: string,
  answerKey: string,
  acceptedAnswers?: string[] | null,
): boolean {
  const candidates = [answerKey, ...(acceptedAnswers ?? [])].map(normalize);
  return candidates.includes(normalize(submitted));
}

/** ORDERING/MATCHING answer keys store option *ids* (e.g. ["opt4","opt2"]),
 * but the free-text UI collects the option *text* the user typed/selected
 * (e.g. ["A","B"]) — so comparison must go through the option id->text map,
 * not a raw array-equality check against the stored ids. */
function arrayMatchesByOptionText(
  submitted: string[],
  answerKeyIds: string[],
  options: QuestionOption[],
): boolean {
  if (submitted.length !== answerKeyIds.length) return false;
  const idToText = new Map(options.map((o) => [o.id, o.text]));
  return submitted.every((s, i) => {
    const expectedText = idToText.get(answerKeyIds[i]) ?? answerKeyIds[i];
    return normalize(s) === normalize(expectedText);
  });
}

/**
 * Human-readable expected answer for the Fase 6 Buku Kesalahan review card
 * (Master Prompt §8.10: "jawaban yang diharapkan"). Resolves option ids to
 * their text the same way grading does, so what the user reads matches what
 * was actually checked. Never called before an answer is submitted —
 * callers must keep this server-only (see D-021).
 */
export function describeExpectedAnswer(question: {
  type: string;
  answerKey: unknown;
  options?: unknown;
}): string {
  const options = Array.isArray(question.options) ? (question.options as QuestionOption[]) : [];
  const idToText = new Map(options.map((o) => [o.id, o.text]));

  if (question.type === "ORDERING" || question.type === "MATCHING") {
    const key = Array.isArray(question.answerKey) ? (question.answerKey as string[]) : [];
    return key.map((id) => idToText.get(id) ?? id).join(", ");
  }
  if (question.type === "MULTIPLE_CHOICE") {
    const key = Array.isArray(question.answerKey)
      ? (question.answerKey as string[])[0]
      : (question.answerKey as string);
    return idToText.get(key ?? "") ?? key ?? "";
  }
  return Array.isArray(question.answerKey)
    ? (question.answerKey as string[]).join(", ")
    : String(question.answerKey ?? "");
}

/**
 * Pure comparison logic shared by the Fase 3 lesson mini-quiz and the Fase 6
 * practice engine / Buku Kesalahan review — keeping grading in one
 * server-only place means answer keys never need to reach the client bundle
 * for any of them.
 */
export function gradeAnswer(
  question: { type: string; answerKey: unknown; acceptedAnswers?: unknown; options?: unknown },
  submitted: string | string[],
): boolean {
  const acceptedAnswers = Array.isArray(question.acceptedAnswers)
    ? (question.acceptedAnswers as string[])
    : undefined;
  const options = Array.isArray(question.options) ? (question.options as QuestionOption[]) : [];

  switch (question.type) {
    case "ORDERING":
    case "MATCHING": {
      const key = Array.isArray(question.answerKey) ? (question.answerKey as string[]) : [];
      const sub = Array.isArray(submitted) ? submitted : [submitted];
      return arrayMatchesByOptionText(sub, key, options);
    }
    default: {
      const key = Array.isArray(question.answerKey)
        ? (question.answerKey as string[])[0]
        : (question.answerKey as string);
      const sub = Array.isArray(submitted) ? submitted[0] : submitted;
      return stringMatches(sub ?? "", key ?? "", acceptedAnswers);
    }
  }
}
