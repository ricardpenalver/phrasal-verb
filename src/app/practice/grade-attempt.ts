import { z } from "zod";
import type { Item } from "@/content/items";
import { gradeResponse } from "@/engine/grading";

export const MAX_RESPONSE_LENGTH = 200;

const attemptInput = z.object({
  itemId: z.string().min(1).max(100),
  response: z.string().max(MAX_RESPONSE_LENGTH),
});

export type AttemptInput = z.infer<typeof attemptInput>;

export type AttemptFeedback =
  | {
      status: "graded";
      outcome: "correct" | "incorrect";
      /** The form the learner should have written: theirs if accepted, else the first accepted answer. */
      solution: string;
      explanation: string;
      /** Server time (epoch ms). The attempt log uses it instead of the client clock. */
      gradedAt: number;
    }
  | { status: "unknown-item" }
  | { status: "invalid-input" };

/** Server-side grading boundary: the accepted answers never leave the server before an attempt. */
export function gradeItemAttempt(
  bank: readonly Item[],
  now: number,
  raw: unknown,
): AttemptFeedback {
  const input = attemptInput.safeParse(raw);
  if (!input.success) {
    return { status: "invalid-input" };
  }

  const item = bank.find(({ id }) => id === input.data.itemId);
  if (item === undefined) {
    return { status: "unknown-item" };
  }

  const result = gradeResponse(input.data.response, item.accepted);
  return {
    status: "graded",
    outcome: result.outcome,
    solution: result.outcome === "correct" ? result.matched : item.accepted[0]!,
    explanation: item.explanation,
    gradedAt: now,
  };
}
