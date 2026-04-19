import { beforeEach, expect, test } from "vitest";
import { db } from "../data/db";
import { useAppStore } from "./use-app-store";

beforeEach(async () => {
  await db.delete();
  await db.open();
  useAppStore.setState({
    rules: [],
    events: [],
    dayScore: 0,
    totalScore: 0,
    riskStatus: "danger",
  });
});

test("starts with empty rules before bootstrap", () => {
  expect(useAppStore.getState().rules).toEqual([]);
  expect(useAppStore.getState().events).toEqual([]);
  expect(useAppStore.getState().dayScore).toBe(0);
  expect(useAppStore.getState().totalScore).toBe(0);
});

test("hydrates default rules and derived scores on bootstrap", async () => {
  await useAppStore.getState().bootstrap();

  const state = useAppStore.getState();

  expect(state.rules.length).toBeGreaterThan(0);
  expect(state.rules.some((rule) => rule.id === "must-ai-study-30m")).toBe(true);
  expect(state.rules.some((rule) => rule.id === "family-task-basic")).toBe(true);
  expect(state.rules.some((rule) => rule.id === "family-companion-10m")).toBe(true);
  expect(state.dayScore).toBe(0);
  expect(state.totalScore).toBe(0);
  expect(state.events).toEqual([]);
});

test("records a must rule once per day", async () => {
  await useAppStore.getState().bootstrap();

  const firstResult = await useAppStore.getState().recordGain("must-ai-study-30m");
  const secondResult = await useAppStore.getState().recordGain("must-ai-study-30m");

  const state = useAppStore.getState();
  expect(firstResult.ok).toBe(true);
  expect(secondResult).toEqual({
    ok: false,
    reason: "ALREADY_COMPLETED_TODAY",
  });
  expect(state.dayScore).toBe(6);
  expect(state.totalScore).toBe(6);
  expect(state.events).toHaveLength(1);
  expect(state.hasCompletedToday("must-ai-study-30m")).toBe(true);
});

test("records family actions as repeated gain events", async () => {
  await useAppStore.getState().bootstrap();

  await useAppStore.getState().recordGain("family-task-basic");
  await useAppStore.getState().recordGain("family-companion-10m");
  await useAppStore.getState().recordGain("family-task-basic");

  const state = useAppStore.getState();
  expect(state.dayScore).toBe(10);
  expect(state.totalScore).toBe(10);
  expect(state.getTodayCount("family-task-basic")).toBe(2);
  expect(state.getTodayCount("family-companion-10m")).toBe(1);
  expect(state.events).toHaveLength(3);
});

test("records a stepped vice rule with the selected step score", async () => {
  await useAppStore.getState().bootstrap();

  await useAppStore.getState().recordGain("must-ai-study-30m");
  const result = await useAppStore.getState().recordSteppedLoss("vice-game-overtime", 3);

  const state = useAppStore.getState();
  expect(result).toEqual({ ok: true, reason: null });
  expect(state.dayScore).toBe(-3);
  expect(state.totalScore).toBe(0);
  expect(state.events.at(0)?.ruleId).toBe("vice-game-overtime");
  expect(state.events.at(0)?.scoreDelta).toBe(-9);
});

test("adds a custom fixed gain rule", async () => {
  await useAppStore.getState().bootstrap();

  await useAppStore.getState().addFixedRule({
    name: "阅读 20 分钟",
    kind: "bonus",
    score: 3,
    unit: "minute",
  });

  const state = useAppStore.getState();
  expect(state.rules).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "阅读 20 分钟",
        kind: "bonus",
        direction: "gain",
        score: 3,
      }),
    ]),
  );
});

test("redeems when score is sufficient and blocks when score is insufficient", async () => {
  await useAppStore.getState().bootstrap();

  await useAppStore.getState().recordGain("must-ai-study-30m");
  await useAppStore.getState().recordGain("must-plank");

  const success = await useAppStore.getState().redeemRule("redeem-game-30m");
  const failure = await useAppStore.getState().redeemRule("redeem-game-30m");

  const state = useAppStore.getState();
  expect(success).toEqual({ ok: true, reason: null });
  expect(failure).toEqual({ ok: false, reason: "INSUFFICIENT_SCORE" });
  expect(state.dayScore).toBe(2);
  expect(state.totalScore).toBe(2);
  expect(state.events).toHaveLength(3);
});

test("blocks redeem when cooldown is active", async () => {
  await useAppStore.getState().bootstrap();

  await useAppStore.getState().recordGain("must-ai-study-30m");
  await useAppStore.getState().recordGain("must-plank");
  await useAppStore.getState().recordGain("must-wall-sit");
  await useAppStore.getState().recordGain("must-squat");
  await useAppStore.getState().recordGain("must-standing-pushup");
  await useAppStore.getState().recordGain("must-meditation-5m");
  await useAppStore.getState().recordGain("bonus-swim-1km");
  await useAppStore.getState().recordGain("bonus-ai-study-60m");
  await useAppStore.getState().recordGain("family-companion-10m");

  const firstRedeem = await useAppStore.getState().redeemRule("redeem-oil-burst");
  const secondRedeem = await useAppStore.getState().redeemRule("redeem-oil-burst");

  expect(firstRedeem).toEqual({ ok: true, reason: null });
  expect(secondRedeem).toEqual({ ok: false, reason: "COOLDOWN_ACTIVE" });
  expect(useAppStore.getState().events.filter((event) => event.ruleId === "redeem-oil-burst"))
    .toHaveLength(1);
});
