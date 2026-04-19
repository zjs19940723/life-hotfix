import { redeemItem } from "./redeem-item";

test("blocks redemption when the user does not have enough score", () => {
  const result = redeemItem({
    totalScore: 5,
    cost: 6,
    cooldownSatisfied: true,
  });

  expect(result.ok).toBe(false);
  expect(result.reason).toBe("INSUFFICIENT_SCORE");
  expect(result.nextTotalScore).toBe(5);
  expect(result.violationFlag).toBe(false);
});

test("blocks redemption when cooldown is still active", () => {
  const result = redeemItem({
    totalScore: 20,
    cost: 6,
    cooldownSatisfied: false,
  });

  expect(result.ok).toBe(false);
  expect(result.reason).toBe("COOLDOWN_ACTIVE");
  expect(result.nextTotalScore).toBe(20);
  expect(result.violationFlag).toBe(false);
});

test("allows forced violation redemption by capping score at zero", () => {
  const result = redeemItem({
    totalScore: 20,
    cost: 50,
    cooldownSatisfied: false,
    forceViolation: true,
  });

  expect(result.ok).toBe(false);
  expect(result.reason).toBe("FORCED_VIOLATION");
  expect(result.nextTotalScore).toBe(0);
  expect(result.violationFlag).toBe(true);
});

test("allows redemption when cost exactly matches total score", () => {
  const result = redeemItem({
    totalScore: 20,
    cost: 20,
    cooldownSatisfied: true,
  });

  expect(result.ok).toBe(true);
  expect(result.reason).toBeNull();
  expect(result.nextTotalScore).toBe(0);
  expect(result.violationFlag).toBe(false);
});

test("keeps forced violation precedence over cooldown and insufficient score", () => {
  const result = redeemItem({
    totalScore: 3,
    cost: 50,
    cooldownSatisfied: false,
    forceViolation: true,
  });

  expect(result.ok).toBe(false);
  expect(result.reason).toBe("FORCED_VIOLATION");
  expect(result.nextTotalScore).toBe(0);
  expect(result.violationFlag).toBe(true);
});

test("rejects a negative cost", () => {
  expect(() =>
    redeemItem({
      totalScore: 10,
      cost: -1,
      cooldownSatisfied: true,
    }),
  ).toThrow("cost must be a non-negative finite number");
});
