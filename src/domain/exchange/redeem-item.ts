export type RedeemItemReason =
  | "INSUFFICIENT_SCORE"
  | "COOLDOWN_ACTIVE"
  | "FORCED_VIOLATION"
  | null;

export interface RedeemItemInput {
  totalScore: number;
  cost: number;
  cooldownSatisfied: boolean;
  forceViolation?: boolean;
}

export interface RedeemItemResult {
  ok: boolean;
  reason: RedeemItemReason;
  nextTotalScore: number;
  violationFlag: boolean;
}

export function redeemItem(input: RedeemItemInput): RedeemItemResult {
  if (!Number.isFinite(input.cost) || input.cost < 0) {
    throw new RangeError("cost must be a non-negative finite number");
  }

  if (input.forceViolation) {
    return {
      ok: false,
      reason: "FORCED_VIOLATION",
      nextTotalScore: Math.max(0, input.totalScore - input.cost),
      violationFlag: true,
    };
  }

  if (!input.cooldownSatisfied) {
    return {
      ok: false,
      reason: "COOLDOWN_ACTIVE",
      nextTotalScore: input.totalScore,
      violationFlag: false,
    };
  }

  if (input.totalScore < input.cost) {
    return {
      ok: false,
      reason: "INSUFFICIENT_SCORE",
      nextTotalScore: input.totalScore,
      violationFlag: false,
    };
  }

  return {
    ok: true,
    reason: null,
    nextTotalScore: input.totalScore - input.cost,
    violationFlag: false,
  };
}
