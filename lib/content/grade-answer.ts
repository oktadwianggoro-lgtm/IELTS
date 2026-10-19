import "server-only";

type QuestionOption = { id: string; text: string };

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function stringMatches(submitted: string, answerKey: string, acceptedAnswers?: string[] | null): boolean {
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
 * Pure comparison logic shared by the Fase 3 lesson mini-quiz and (future)
 * Fase 6 practice engine — keeping grading in one server-only place means
 * answer keys never need to reach the client bundle for either feature.
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
