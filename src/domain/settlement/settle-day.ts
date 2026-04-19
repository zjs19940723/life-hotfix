export function settleDay(input: {
  currentDayScore: number;
  currentTotalScore: number;
  pendingMustLosses: number[];
}) {
  const baseValues = [input.currentDayScore, input.currentTotalScore];
  if (baseValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("settlement inputs must be non-negative finite numbers");
  }

  if (input.pendingMustLosses.some((loss) => !Number.isFinite(loss) || loss < 0)) {
    throw new RangeError("pending must losses must be non-negative finite numbers");
  }

  const totalLoss = input.pendingMustLosses.reduce((sum, loss) => sum + loss, 0);
  const nextDayScore = input.currentDayScore - totalLoss;
  const rawTotalScore = input.currentTotalScore - totalLoss;

  return {
    dayScore: nextDayScore,
    totalScore: Math.max(0, rawTotalScore),
    severeViolation: rawTotalScore < 0,
  };
}
