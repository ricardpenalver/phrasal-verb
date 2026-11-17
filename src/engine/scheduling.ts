// Leitner-style spaced repetition (provisional algorithm, see CLAUDE.md).
// Review state is never stored: it is derived from the attempt log, which
// stays the single source of truth for anything shown to the learner.

export type Attempt = {
  itemId: string;
  outcome: "correct" | "incorrect";
  /** Epoch milliseconds. */
  at: number;
};

export type ReviewState = {
  /** 0 = just missed, 1..5 = consecutive successful recalls (capped). */
  box: number;
  /** Epoch milliseconds when the item should be reviewed again. */
  dueAt: number;
};

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Delay after a miss: long enough that the answer just shown is not still in view. */
const RETRY_DELAY = 10 * MINUTE;

/** Index = box reached after a correct answer. */
const BOX_INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY] as const;
const TOP_BOX = BOX_INTERVALS.length - 1;

function applyAttempt(
  previous: ReviewState | undefined,
  attempt: Attempt,
): ReviewState {
  if (attempt.outcome === "incorrect") {
    return { box: 0, dueAt: attempt.at + RETRY_DELAY };
  }
  const box = Math.min((previous?.box ?? 0) + 1, TOP_BOX);
  return { box, dueAt: attempt.at + BOX_INTERVALS[box]! };
}

export function deriveReviewStates(
  attempts: readonly Attempt[],
): Map<string, ReviewState> {
  for (const attempt of attempts) {
    if (!Number.isFinite(attempt.at)) {
      throw new RangeError(`Attempt for "${attempt.itemId}" has no valid time.`);
    }
  }

  const chronological = [...attempts].sort((a, b) => a.at - b.at);
  const states = new Map<string, ReviewState>();
  for (const attempt of chronological) {
    states.set(attempt.itemId, applyAttempt(states.get(attempt.itemId), attempt));
  }
  return states;
}

/**
 * Picks what to practise next: the overdue review that has waited longest,
 * otherwise the first unseen item in bank order, otherwise nothing.
 */
export function nextItemId(
  bank: readonly string[],
  attempts: readonly Attempt[],
  now: number,
): string | null {
  const states = deriveReviewStates(attempts);

  let oldestDue: { id: string; dueAt: number } | null = null;
  let firstUnseen: string | null = null;

  for (const id of bank) {
    const state = states.get(id);
    if (state === undefined) {
      firstUnseen ??= id;
    } else if (state.dueAt <= now && (oldestDue === null || state.dueAt < oldestDue.dueAt)) {
      oldestDue = { id, dueAt: state.dueAt };
    }
  }

  return oldestDue?.id ?? firstUnseen;
}
