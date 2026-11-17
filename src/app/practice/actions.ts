"use server";

import { phrasalVerbBank } from "@/content/phrasal-verbs";
import { type AttemptFeedback, gradeItemAttempt } from "./grade-attempt";

// Learner responses are deliberately not logged: accounts may belong to minors.
export async function submitAttempt(raw: unknown): Promise<AttemptFeedback> {
  return gradeItemAttempt(phrasalVerbBank, Date.now(), raw);
}
