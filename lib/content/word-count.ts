/** Simple whitespace-based word count, shared across labs that show a live
 * word-count hint (Reading Lab's word-limit warning, Writing Lab's live
 * counter + the server action that recomputes/stores the authoritative
 * count on save) — all callers must agree on one definition. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
