import type { RiskStatus } from "../types";

export function calculateRiskStatus(input: {
  totalScore: number;
  pendingLoss: number;
  projectedViceLoss: number;
}): RiskStatus {
  const values = [input.totalScore, input.pendingLoss, input.projectedViceLoss];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("risk inputs must be non-negative finite numbers");
  }

  const projectedTotal =
    input.totalScore - input.pendingLoss - input.projectedViceLoss;

  if (projectedTotal <= 0) {
    return "danger";
  }

  if (projectedTotal <= 10) {
    return "warning";
  }

  return "safe";
}
