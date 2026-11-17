export type GradeResult =
  | { outcome: "correct"; matched: string }
  | { outcome: "incorrect" };

const TYPOGRAPHIC_APOSTROPHES = /[‘’ʼ]/g;
const WHITESPACE_RUNS = /\s+/g;
const TRAILING_PUNCTUATION = /[\s.!?,;:]+$/;

/**
 * Canonical form used to compare a learner's answer with the item bank.
 * Only differences that carry no linguistic meaning are erased: case,
 * spacing, Unicode composition, apostrophe style and closing punctuation.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(TYPOGRAPHIC_APOSTROPHES, "'")
    .toLowerCase()
    .replace(WHITESPACE_RUNS, " ")
    .trim()
    .replace(TRAILING_PUNCTUATION, "");
}

/**
 * Deterministic grading of a closed-answer item. Spelling and particles
 * are significant: a near miss is incorrect, never partially correct.
 */
export function gradeResponse(
  response: string,
  accepted: readonly string[],
): GradeResult {
  if (accepted.length === 0) {
    throw new RangeError("An item must have at least one accepted answer.");
  }

  const normalized = normalizeAnswer(response);
  if (normalized === "") {
    return { outcome: "incorrect" };
  }

  const matched = accepted.find(
    (answer) => normalizeAnswer(answer) === normalized,
  );
  return matched === undefined
    ? { outcome: "incorrect" }
    : { outcome: "correct", matched };
}
