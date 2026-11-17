import { describe, expect, test } from "vitest";
import { gradeResponse, normalizeAnswer } from "./grading";

describe("normalizeAnswer", () => {
  test.each([
    ["put off", "put off"],
    ["  put off  ", "put off"],
    ["put   off", "put off"],
    ["put\toff\n", "put off"],
    ["put off", "put off"],
    ["Put Off", "put off"],
    ["PUT OFF", "put off"],
    ["put off.", "put off"],
    ["put off !?", "put off"],
    ["don’t", "don't"],
    ["café", "café"],
    ["", ""],
    ["   ", ""],
  ])("normalizes %j to %j", (raw, want) => {
    const got = normalizeAnswer(raw);

    expect(got).toBe(want);
  });

  test("keeps punctuation that is not at the end", () => {
    const got = normalizeAnswer("mother-in-law's");

    expect(got).toBe("mother-in-law's");
  });
});

describe("gradeResponse", () => {
  test("accepts the exact answer", () => {
    const result = gradeResponse("put off", ["put off"]);

    expect(result).toEqual({ outcome: "correct", matched: "put off" });
  });

  test("ignores case, spacing and trailing punctuation in the response", () => {
    const result = gradeResponse("  Put   OFF. ", ["put off"]);

    expect(result).toEqual({ outcome: "correct", matched: "put off" });
  });

  test("accepts any listed alternative and reports which one matched", () => {
    const accepted = ["get on with", "get along with"];

    const result = gradeResponse("get along with", accepted);

    expect(result).toEqual({ outcome: "correct", matched: "get along with" });
  });

  test("reports the bank's spelling, not the learner's", () => {
    const result = gradeResponse("GAVE  UP", ["gave up"]);

    expect(result).toEqual({ outcome: "correct", matched: "gave up" });
  });

  test("normalizes the accepted answers too", () => {
    const result = gradeResponse("put off", [" Put  Off "]);

    expect(result).toEqual({ outcome: "correct", matched: " Put  Off " });
  });

  test.each([
    ["wrong particle", "put on"],
    ["misspelling", "put of"],
    ["only the verb", "put"],
    ["extra word", "put off it"],
    ["words run together", "putoff"],
    ["wrong tense", "puts off"],
    ["empty response", ""],
    ["whitespace only", "   "],
  ])("rejects %s", (_label, response) => {
    const result = gradeResponse(response, ["put off"]);

    expect(result).toEqual({ outcome: "incorrect" });
  });

  test("rejects a very long response without matching a prefix", () => {
    const response = "put off ".repeat(5000);

    const result = gradeResponse(response, ["put off"]);

    expect(result).toEqual({ outcome: "incorrect" });
  });

  test("throws when an item has no accepted answers", () => {
    expect(() => gradeResponse("put off", [])).toThrow(RangeError);
  });

  test("never accepts an empty response, even against a blank accepted answer", () => {
    const result = gradeResponse("", [""]);

    expect(result).toEqual({ outcome: "incorrect" });
  });
});
