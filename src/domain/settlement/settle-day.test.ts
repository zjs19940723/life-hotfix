import { settleDay } from "./settle-day";

test("deducts all pending must losses during settlement", () => {
  const result = settleDay({
    currentDayScore: 6,
    currentTotalScore: 20,
    pendingMustLosses: [6, 2, 3],
  });

  expect(result.dayScore).toBe(-5);
  expect(result.totalScore).toBe(9);
  expect(result.severeViolation).toBe(false);
});

test("caps total score at zero and flags a severe violation", () => {
  const result = settleDay({
    currentDayScore: 4,
    currentTotalScore: 5,
    pendingMustLosses: [3, 4],
  });

  expect(result.dayScore).toBe(-3);
  expect(result.totalScore).toBe(0);
  expect(result.severeViolation).toBe(true);
});

test("keeps scores unchanged when there are no pending losses", () => {
  const result = settleDay({
    currentDayScore: 7,
    currentTotalScore: 12,
    pendingMustLosses: [],
  });

  expect(result.dayScore).toBe(7);
  expect(result.totalScore).toBe(12);
  expect(result.severeViolation).toBe(false);
});

test("rejects a negative pending loss", () => {
  expect(() =>
    settleDay({
      currentDayScore: 7,
      currentTotalScore: 12,
      pendingMustLosses: [2, -1],
    }),
  ).toThrow("pending must losses must be non-negative finite numbers");
});

test("rejects a non-finite total score", () => {
  expect(() =>
    settleDay({
      currentDayScore: 7,
      currentTotalScore: Number.NaN,
      pendingMustLosses: [2],
    }),
  ).toThrow("settlement inputs must be non-negative finite numbers");
});
