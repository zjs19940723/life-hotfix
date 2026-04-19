import { defaultRules } from "../rules/default-rules";
import { applyScoreEvent } from "./apply-score-event";

test("contains core default rules from the approved spec", () => {
  const ids = defaultRules.map((rule) => rule.id);

  expect(ids).toContain("must-ai-study-30m");
  expect(ids).toContain("must-plank");
  expect(ids).toContain("vice-late-sleep");
  expect(ids).toContain("redeem-oil-burst");
  expect(ids).toContain("redeem-game-30m");
});

test("keeps default rules unique and structurally valid", () => {
  const ids = defaultRules.map((rule) => rule.id);

  expect(new Set(ids).size).toBe(ids.length);

  const lateSleepRule = defaultRules.find((rule) => rule.id === "vice-late-sleep");
  expect(lateSleepRule).toBeDefined();
  expect(lateSleepRule?.steps?.length).toBeGreaterThan(0);

  const oilBurstRule = defaultRules.find((rule) => rule.id === "redeem-oil-burst");
  expect(oilBurstRule?.kind).toBe("redeem");
  expect(oilBurstRule?.score).toBe(35);
});

test("applies a gain event to day and total scores", () => {
  const result = applyScoreEvent({
    currentDayScore: 0,
    currentTotalScore: 10,
    delta: 6,
    direction: "gain",
  });

  expect(result.dayScore).toBe(6);
  expect(result.totalScore).toBe(16);
  expect(result.violationFlag).toBe(false);
});

test("caps a losing event at zero and marks a violation", () => {
  const result = applyScoreEvent({
    currentDayScore: 3,
    currentTotalScore: 4,
    delta: 10,
    direction: "loss",
  });

  expect(result.dayScore).toBe(-7);
  expect(result.totalScore).toBe(0);
  expect(result.violationFlag).toBe(true);
});

test("keeps scores unchanged for a zero delta event", () => {
  const result = applyScoreEvent({
    currentDayScore: 4,
    currentTotalScore: 12,
    delta: 0,
    direction: "gain",
  });

  expect(result.dayScore).toBe(4);
  expect(result.totalScore).toBe(12);
  expect(result.violationFlag).toBe(false);
});

test("rejects a negative delta", () => {
  expect(() =>
    applyScoreEvent({
      currentDayScore: 0,
      currentTotalScore: 10,
      delta: -1,
      direction: "loss",
    }),
  ).toThrow("delta must be a non-negative finite number");
});
