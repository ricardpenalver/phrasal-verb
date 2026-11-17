import { z } from "zod";

/** Placeholder the learner fills in. Exactly one per sentence. */
export const GAP = "___";

const nonBlank = z
  .string()
  .refine((value) => value.trim().length > 0, "Must not be blank.");

const itemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use a kebab-case slug."),
  kind: z.literal("gap-fill"),
  /** CEFR Companion Volume scale the item practises, e.g. "Vocabulary range". */
  cefrScale: nonBlank,
  /** Spanish. */
  instruction: nonBlank,
  /** Spanish meaning cue: the learner recalls the English form from it. */
  hint: nonBlank,
  /** English. */
  sentence: nonBlank.refine(
    (value) => value.split(GAP).length === 2,
    `Must contain exactly one ${GAP}.`,
  ),
  accepted: z.array(nonBlank).min(1),
  /** Spanish. Shown only after the learner answers. */
  explanation: nonBlank,
});

export type Item = z.infer<typeof itemSchema>;

/** What the client may see before answering: no solution, no explanation. */
export type PublicItem = Pick<Item, "id" | "instruction" | "hint" | "sentence">;

export function parseItemBank(raw: unknown): Item[] {
  const items = z.array(itemSchema).parse(raw);

  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) {
      throw new Error(`Duplicate item id: ${id}`);
    }
    seen.add(id);
  }
  return items;
}

export function toPublicItem({ id, instruction, hint, sentence }: Item): PublicItem {
  return { id, instruction, hint, sentence };
}
