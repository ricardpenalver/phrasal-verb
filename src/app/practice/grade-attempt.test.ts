import { describe, expect, test } from "vitest";
import { GAP, parseItemBank } from "@/content/items";
import { gradeItemAttempt, MAX_RESPONSE_LENGTH } from "./grade-attempt";

const NOW = Date.UTC(2026, 10, 17, 9, 0, 0);

const bank = parseItemBank([
  {
    id: "fill-in-form",
    kind: "gap-fill",
    cefrScale: "Vocabulary range",
    instruction: "Escribe el phrasal verb.",
    hint: "rellenar",
    sentence: `Please ${GAP} the form.`,
    accepted: ["fill in", "fill out"],
    explanation: "Fill in o fill out.",
  },
]);

describe("gradeItemAttempt", () => {
  test("a correct answer returns the matched form and the explanation", () => {
    const feedback = gradeItemAttempt(bank, NOW, {
      itemId: "fill-in-form",
      response: "Fill OUT",
    });

    expect(feedback).toEqual({
      status: "graded",
      outcome: "correct",
      solution: "fill out",
      explanation: "Fill in o fill out.",
      gradedAt: NOW,
    });
  });

  test("an incorrect answer reveals the first accepted answer", () => {
    const feedback = gradeItemAttempt(bank, NOW, {
      itemId: "fill-in-form",
      response: "fill up",
    });

    expect(feedback).toEqual({
      status: "graded",
      outcome: "incorrect",
      solution: "fill in",
      explanation: "Fill in o fill out.",
      gradedAt: NOW,
    });
  });

  test("an empty answer counts as incorrect", () => {
    const feedback = gradeItemAttempt(bank, NOW, { itemId: "fill-in-form", response: "" });

    expect(feedback).toMatchObject({ status: "graded", outcome: "incorrect" });
  });

  test("reports an item id that is not in the bank", () => {
    const feedback = gradeItemAttempt(bank, NOW, { itemId: "nope", response: "fill in" });

    expect(feedback).toEqual({ status: "unknown-item" });
  });

  test("accepts a response at the length limit", () => {
    const feedback = gradeItemAttempt(bank, NOW, {
      itemId: "fill-in-form",
      response: "x".repeat(MAX_RESPONSE_LENGTH),
    });

    expect(feedback).toMatchObject({ status: "graded", outcome: "incorrect" });
  });

  test.each([
    ["null", null],
    ["a string", "fill in"],
    ["a missing response", { itemId: "fill-in-form" }],
    ["a numeric response", { itemId: "fill-in-form", response: 42 }],
    ["a missing item id", { response: "fill in" }],
    ["a response over the length limit", { itemId: "fill-in-form", response: "x".repeat(MAX_RESPONSE_LENGTH + 1) }],
  ])("rejects %s as invalid input", (_label, raw) => {
    const feedback = gradeItemAttempt(bank, NOW, raw);

    expect(feedback).toEqual({ status: "invalid-input" });
  });
});
