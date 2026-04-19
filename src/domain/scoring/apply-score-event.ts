import type { ScoreEventInput, ScoreEventResult } from "./score-event";

export function applyScoreEvent(input: ScoreEventInput): ScoreEventResult {
  if (!Number.isFinite(input.delta) || input.delta < 0) {
    throw new RangeError("delta must be a non-negative finite number");
  }

  const signedDelta =
    input.direction === "gain" ? Math.abs(input.delta) : -Math.abs(input.delta);

  const nextDayScore = input.currentDayScore + signedDelta;
  const rawTotalScore = input.currentTotalScore + signedDelta;

  return {
    dayScore: nextDayScore,
    totalScore: Math.max(0, rawTotalScore),
    violationFlag: rawTotalScore < 0,
  };
}
