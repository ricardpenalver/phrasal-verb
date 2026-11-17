import { describe, expect, test } from "vitest";
import { type Attempt, deriveReviewStates, nextItemId } from "./scheduling";

const MINUTE = 60_000;
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 17, 9, 0, 0);

const ok = (itemId: string, at: number): Attempt => ({
  itemId,
  outcome: "correct",
  at,
});
const ko = (itemId: string, at: number): Attempt => ({
  itemId,
  outcome: "incorrect",
  at,
});

describe("deriveReviewStates", () => {
  test("returns no state for an item never attempted", () => {
    const states = deriveReviewStates([]);

    expect(states.get("a")).toBeUndefined();
  });

  test("a first correct answer moves the item to box 1, due in 1 day", () => {
    const states = deriveReviewStates([ok("a", T0)]);

    expect(states.get("a")).toEqual({ box: 1, dueAt: T0 + 1 * DAY });
  });

  test.each([
    [2, 2, 3],
    [3, 3, 7],
    [4, 4, 16],
    [5, 5, 35],
  ])(
    "%i consecutive correct answers reach box %i, due %i days after the last",
    (count, box, days) => {
      const attempts = Array.from({ length: count }, (_, i) =>
        ok("a", T0 + i * 40 * DAY),
      );
      const last = T0 + (count - 1) * 40 * DAY;

      const states = deriveReviewStates(attempts);

      expect(states.get("a")).toEqual({ box, dueAt: last + days * DAY });
    },
  );

  test("stays in box 5 after further correct answers", () => {
    const attempts = Array.from({ length: 8 }, (_, i) =>
      ok("a", T0 + i * 40 * DAY),
    );
    const last = T0 + 7 * 40 * DAY;

    const states = deriveReviewStates(attempts);

    expect(states.get("a")).toEqual({ box: 5, dueAt: last + 35 * DAY });
  });

  test("an incorrect answer sends the item back to box 0, due in 10 minutes", () => {
    const attempts = [
      ok("a", T0),
      ok("a", T0 + 2 * DAY),
      ok("a", T0 + 6 * DAY),
      ko("a", T0 + 14 * DAY),
    ];

    const states = deriveReviewStates(attempts);

    expect(states.get("a")).toEqual({
      box: 0,
      dueAt: T0 + 14 * DAY + 10 * MINUTE,
    });
  });

  test("a correct answer after a miss restarts the climb at box 1", () => {
    const attempts = [ok("a", T0), ok("a", T0 + 2 * DAY), ko("a", T0 + 6 * DAY), ok("a", T0 + 7 * DAY)];

    const states = deriveReviewStates(attempts);

    expect(states.get("a")).toEqual({ box: 1, dueAt: T0 + 8 * DAY });
  });

  test("applies attempts in time order regardless of input order", () => {
    const attempts = [ko("a", T0 + 2 * DAY), ok("a", T0)];

    const states = deriveReviewStates(attempts);

    expect(states.get("a")).toEqual({
      box: 0,
      dueAt: T0 + 2 * DAY + 10 * MINUTE,
    });
  });

  test("keeps the history of each item separate", () => {
    const attempts = [ok("a", T0), ko("b", T0), ok("a", T0 + 2 * DAY)];

    const states = deriveReviewStates(attempts);

    expect(states.get("a")).toEqual({ box: 2, dueAt: T0 + 5 * DAY });
    expect(states.get("b")).toEqual({ box: 0, dueAt: T0 + 10 * MINUTE });
  });

  test("does not reorder the caller's array", () => {
    const attempts = [ko("a", T0 + DAY), ok("a", T0)];

    deriveReviewStates(attempts);

    expect(attempts.map((a) => a.at)).toEqual([T0 + DAY, T0]);
  });

  test.each([NaN, Infinity, -Infinity])(
    "rejects an attempt whose time is %s",
    (at) => {
      expect(() => deriveReviewStates([ok("a", at)])).toThrow(RangeError);
    },
  );
});

describe("nextItemId", () => {
  const bank = ["a", "b", "c"];

  test("offers the first unseen item when nothing has been attempted", () => {
    const next = nextItemId(bank, [], T0);

    expect(next).toBe("a");
  });

  test("returns null for an empty bank", () => {
    const next = nextItemId([], [], T0);

    expect(next).toBeNull();
  });

  test("skips items that are scheduled for later", () => {
    const attempts = [ok("a", T0)];

    const next = nextItemId(bank, attempts, T0 + MINUTE);

    expect(next).toBe("b");
  });

  test("returns null when every item is scheduled for later", () => {
    const attempts = [ok("a", T0), ok("b", T0), ok("c", T0)];

    const next = nextItemId(bank, attempts, T0 + MINUTE);

    expect(next).toBeNull();
  });

  test("does not re-offer a missed item before its 10-minute delay", () => {
    const attempts = [ko("a", T0), ok("b", T0), ok("c", T0)];

    const next = nextItemId(bank, attempts, T0 + 9 * MINUTE);

    expect(next).toBeNull();
  });

  test("offers an item exactly when it becomes due", () => {
    const attempts = [ko("a", T0), ok("b", T0), ok("c", T0)];

    const next = nextItemId(bank, attempts, T0 + 10 * MINUTE);

    expect(next).toBe("a");
  });

  test("prefers a due review over an unseen item", () => {
    const attempts = [ok("c", T0)];

    const next = nextItemId(bank, attempts, T0 + DAY);

    expect(next).toBe("c");
  });

  test("among due reviews, offers the one that has waited longest", () => {
    const attempts = [ok("a", T0 + 2 * DAY), ok("b", T0)];

    const next = nextItemId(bank, attempts, T0 + 10 * DAY);

    expect(next).toBe("b");
  });

  test("ignores attempts for items no longer in the bank", () => {
    const attempts = [ok("retired", T0 - 10 * DAY)];

    const next = nextItemId(["a"], attempts, T0);

    expect(next).toBe("a");
  });
});
