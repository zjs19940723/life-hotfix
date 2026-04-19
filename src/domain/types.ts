export type RuleKind =
  | "must"
  | "bonus"
  | "vice"
  | "redeem"
  | "family-task"
  | "family-companion";

export type ScoreDirection = "gain" | "loss" | "spend";

export type RiskStatus = "safe" | "warning" | "danger";

export type RuleUnit = "count" | "minute" | "money" | "time-slot";

export interface RuleStep {
  threshold: number;
  score: number;
  label: string;
}

interface BaseRuleDefinition {
  id: string;
  name: string;
  unit: RuleUnit;
  enabledByDefault: boolean;
  privateLabel?: boolean;
  dailyCap?: number;
  cooldownDays?: number;
}

interface FlatScoreRuleDefinition extends BaseRuleDefinition {
  score: number;
  steps?: never;
}

interface SteppedScoreRuleDefinition extends BaseRuleDefinition {
  steps: readonly RuleStep[];
  score?: never;
}

export interface MustRuleDefinition extends FlatScoreRuleDefinition {
  kind: "must";
  direction: "gain";
  riskStatus: "safe" | "warning";
}

export interface BonusRuleDefinition extends FlatScoreRuleDefinition {
  kind: "bonus";
  direction: "gain";
  riskStatus: "safe" | "warning";
}

export type ViceRuleDefinition = (FlatScoreRuleDefinition | SteppedScoreRuleDefinition) & {
  kind: "vice";
  direction: "loss";
  riskStatus: "warning" | "danger";
};

export type RedeemRuleDefinition = (FlatScoreRuleDefinition | SteppedScoreRuleDefinition) & {
  kind: "redeem";
  direction: "spend";
  riskStatus: "warning" | "danger";
};

export interface FamilyTaskRuleDefinition extends FlatScoreRuleDefinition {
  kind: "family-task";
  direction: "gain";
  riskStatus: "safe";
}

export interface FamilyCompanionRuleDefinition extends FlatScoreRuleDefinition {
  kind: "family-companion";
  direction: "gain";
  riskStatus: "safe";
}

export type RuleDefinition =
  | MustRuleDefinition
  | BonusRuleDefinition
  | ViceRuleDefinition
  | RedeemRuleDefinition
  | FamilyTaskRuleDefinition
  | FamilyCompanionRuleDefinition;
