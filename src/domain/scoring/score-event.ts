import type { ScoreDirection } from "../types";

export interface ScoreEventInput {
  currentDayScore: number;
  currentTotalScore: number;
  delta: number;
  direction: ScoreDirection;
}

export interface ScoreEventResult {
  dayScore: number;
  totalScore: number;
  violationFlag: boolean;
}
