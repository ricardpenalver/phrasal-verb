import { describe, expect, test } from "vitest";
import { GAP, parseItemBank, toPublicItem } from "./items";
import { phrasalVerbBank } from "./phrasal-verbs";

const validItem = {
  id: "put-off-meeting",
  kind: "gap-fill",
  cefrScale: "Vocabulary range",
  instruction: "Completa con el phrasal verb adecuado.",
  hint: "posponer",
  sentence: `We had to ${GAP} the meeting until Friday.`,
  accepted: ["put off"],
  explanation: "Put off significa posponer.",
};

describe("parseItemBank", () => {
  test("accepts a well-formed item", () => {
    const bank = parseItemBank([validItem]);

    expect(bank).toEqual([validItem]);
  });

  test.each([
    ["no accepted answers", { accepted: [] }],
    ["a blank accepted answer", { accepted: ["put off", "  "] }],
    ["a sentence without a gap", { sentence: "We had to postpone the meeting." }],
    ["a sentence with two gaps", { sentence: `We ${GAP} the ${GAP}.` }],
    ["an id with spaces", { id: "put off" }],
    ["an empty id", { id: "" }],
    ["an unknown kind", { kind: "multiple-choice" }],
    ["an empty explanation", { explanation: "" }],
    ["an empty hint", { hint: "" }],
  ])("rejects an item with %s", (_label, override) => {
    const raw = [{ ...validItem, ...override }];

    expect(() => parseItemBank(raw)).toThrow();
  });

  test("rejects a bank where two items share an id", () => {
    const raw = [validItem, { ...validItem, hint: "aplazar" }];

    expect(() => parseItemBank(raw)).toThrow(/put-off-meeting/);
  });

  test("rejects input that is not a list", () => {
    expect(() => parseItemBank({ items: [validItem] })).toThrow();
  });
});

describe("toPublicItem", () => {
  test("drops the answers and the explanation", () => {
    const [item] = parseItemBank([validItem]);

    const publicItem = toPublicItem(item!);

    expect(publicItem).toEqual({
      id: "put-off-meeting",
      instruction: "Completa con el phrasal verb adecuado.",
      hint: "posponer",
      sentence: `We had to ${GAP} the meeting until Friday.`,
    });
  });
});

describe("phrasalVerbBank", () => {
  test("is a valid, non-empty bank", () => {
    expect(phrasalVerbBank.length).toBeGreaterThan(0);
  });
});
