import { calculateRiskStatus } from "./calculate-risk-status";

test("returns safe when projected score stays comfortably above the warning threshold", () => {
  expect(
    calculateRiskStatus({
      totalScore: 20,
      pendingLoss: 2,
      projectedViceLoss: 3,
    }),
  ).toBe("safe");
});

test("returns warning when projected score is low but still positive", () => {
  expect(
    calculateRiskStatus({
      totalScore: 12,
      pendingLoss: 1,
      projectedViceLoss: 2,
    }),
  ).toBe("warning");
});

test("returns danger when projected score reaches zero or below", () => {
  expect(
    calculateRiskStatus({
      totalScore: 8,
      pendingLoss: 8,
      projectedViceLoss: 4,
    }),
  ).toBe("danger");
});

test("returns warning when projected score lands exactly on the warning boundary", () => {
  expect(
    calculateRiskStatus({
      totalScore: 15,
      pendingLoss: 3,
      projectedViceLoss: 2,
    }),
  ).toBe("warning");
});

test("returns danger when projected score lands exactly on zero", () => {
  expect(
    calculateRiskStatus({
      totalScore: 10,
      pendingLoss: 4,
      projectedViceLoss: 6,
    }),
  ).toBe("danger");
});

test("rejects a negative input", () => {
  expect(() =>
    calculateRiskStatus({
      totalScore: 10,
      pendingLoss: -1,
      projectedViceLoss: 1,
    }),
  ).toThrow("risk inputs must be non-negative finite numbers");
});
