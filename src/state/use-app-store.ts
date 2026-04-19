import { create } from "zustand";
import { addEvent, clearEvents, listEvents, type CreateEventInput } from "../data/repositories/events-repository";
import { clearDailySummaries } from "../data/repositories/daily-summary-repository";
import { listRules, putRule, replaceRules } from "../data/repositories/rules-repository";
import { defaultRules } from "../domain/rules/default-rules";
import { applyScoreEvent } from "../domain/scoring/apply-score-event";
import { calculateRiskStatus } from "../domain/scoring/calculate-risk-status";
import type { RuleDefinition, RuleKind, RuleUnit, RiskStatus } from "../domain/types";
import { redeemItem } from "../domain/exchange/redeem-item";
import type { PersistedEvent } from "../data/db";

const DATA_SEED_VERSION = "2026-04-20-default-data-reset";
const DATA_SEED_VERSION_KEY = "life-hotfix:data-seed-version";

type ActionReason =
  | "RULE_NOT_FOUND"
  | "INVALID_RULE_KIND"
  | "ALREADY_COMPLETED_TODAY"
  | "DAILY_CAP_REACHED"
  | "INSUFFICIENT_SCORE"
  | "COOLDOWN_ACTIVE"
  | "INVALID_STEP"
  | null;

type ActionResult = {
  ok: boolean;
  reason: ActionReason;
};

type DerivedState = {
  events: PersistedEvent[];
  dayScore: number;
  totalScore: number;
  riskStatus: RiskStatus;
};

type AppState = DerivedState & {
  rules: RuleDefinition[];
  bootstrap: () => Promise<void>;
  recordGain: (ruleId: string) => Promise<ActionResult>;
  recordSteppedLoss: (ruleId: string, stepIndex: number) => Promise<ActionResult>;
  recordCustomScore: (input: RecordCustomScoreInput) => Promise<ActionResult>;
  redeemRule: (ruleId: string) => Promise<ActionResult>;
  redeemCustom: (input: RedeemCustomInput) => Promise<ActionResult>;
  addFixedRule: (input: AddFixedRuleInput) => Promise<void>;
  updateRule: (rule: RuleDefinition) => Promise<void>;
  recordFamilyItem: (input: RecordFamilyItemInput) => Promise<ActionResult>;
  hasCompletedFamilyItemToday: (itemId: string) => boolean;
  hasCompletedToday: (ruleId: string) => boolean;
  getTodayCount: (ruleId: string) => number;
  getRuleName: (ruleId: string) => string;
  getRedeemStatus: (ruleId: string) => { disabled: boolean; reason: ActionReason };
};

type AddFixedRuleInput = {
  name: string;
  kind: RuleKind;
  score: number;
  unit: RuleUnit;
  steps?: Array<{
    threshold: number;
    label: string;
    score: number;
  }>;
};

type RecordFamilyItemInput = {
  itemId: string;
  scoreType: "task" | "companion" | "loss";
};

type RedeemCustomInput = {
  itemId: string;
  cost: number;
};

type RecordCustomScoreInput = {
  itemId: string;
  scoreDelta: number;
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isToday(isoString: string): boolean {
  return getDateKey(new Date(isoString)) === getDateKey(new Date());
}

function sortEventsDescending(events: PersistedEvent[]): PersistedEvent[] {
  return [...events].sort((left, right) => {
    const timeDelta =
      new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime();

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return (right.id ?? 0) - (left.id ?? 0);
  });
}

function replayDayScore(currentScore: number, delta: number): number {
  const result = applyScoreEvent({
    currentDayScore: currentScore,
    currentTotalScore: currentScore,
    delta: Math.abs(delta),
    direction: delta >= 0 ? "gain" : "loss",
  });

  return result.dayScore;
}

function replayTotalScore(currentScore: number, delta: number): number {
  const result = applyScoreEvent({
    currentDayScore: currentScore,
    currentTotalScore: currentScore,
    delta: Math.abs(delta),
    direction: delta >= 0 ? "gain" : "loss",
  });

  return result.totalScore;
}

function isRuleCompletedByEvent(ruleId: string, event: PersistedEvent): boolean {
  return (
    event.scoreDelta > 0 &&
    (event.ruleId === ruleId || event.ruleId.startsWith(`custom-score-today-${ruleId}-`))
  );
}

function deriveState(rules: RuleDefinition[], events: PersistedEvent[]): DerivedState {
  const ascendingEvents = [...events].sort((left, right) => {
    const timeDelta =
      new Date(left.happenedAt).getTime() - new Date(right.happenedAt).getTime();

    if (timeDelta !== 0) {
      return timeDelta;
    }

    return (left.id ?? 0) - (right.id ?? 0);
  });

  let totalScore = 0;
  for (const event of ascendingEvents) {
    totalScore = replayTotalScore(totalScore, event.scoreDelta);
  }

  const todayEvents = ascendingEvents.filter((event) => isToday(event.happenedAt));
  let dayScore = 0;
  for (const event of todayEvents) {
    dayScore = replayDayScore(dayScore, event.scoreDelta);
  }

  const pendingMustLoss = rules
    .filter((rule) => rule.kind === "must")
    .filter((rule) => !todayEvents.some((event) => isRuleCompletedByEvent(rule.id, event)))
    .reduce((sum, rule) => sum + rule.score, 0);

  return {
    events: sortEventsDescending(events),
    dayScore,
    totalScore,
    riskStatus: calculateRiskStatus({
      totalScore,
      pendingLoss: pendingMustLoss,
      projectedViceLoss: 0,
    }),
  };
}

function isCooldownSatisfied(rule: RuleDefinition, events: PersistedEvent[]): boolean {
  if (rule.kind !== "redeem" || !rule.cooldownDays) {
    return true;
  }

  const lastRedeemEvent = events
    .filter((event) => event.ruleId === rule.id)
    .sort(
      (left, right) =>
        new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime(),
    )[0];

  if (!lastRedeemEvent) {
    return true;
  }

  const elapsedMs = Date.now() - new Date(lastRedeemEvent.happenedAt).getTime();
  return elapsedMs >= rule.cooldownDays * 24 * 60 * 60 * 1000;
}

function buildEvent(ruleId: string, scoreDelta: number): CreateEventInput {
  return {
    ruleId,
    scoreDelta,
    happenedAt: new Date().toISOString(),
  };
}

function buildCustomRule(input: AddFixedRuleInput): RuleDefinition {
  const score = Math.abs(input.score);
  const base = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    unit: input.unit,
    enabledByDefault: true,
  };

  if (input.kind === "vice") {
    if (input.steps && input.steps.length > 0) {
      return {
        ...base,
        kind: "vice",
        direction: "loss",
        riskStatus: "warning",
        steps: input.steps.map((step, index) => ({
          threshold: step.threshold || index + 1,
          label: step.label,
          score: step.score > 0 ? -step.score : step.score,
        })),
      };
    }

    return {
      ...base,
      kind: "vice",
      direction: "loss",
      riskStatus: "warning",
      score: -score,
    };
  }

  if (input.kind === "redeem") {
    if (input.steps && input.steps.length > 0) {
      return {
        ...base,
        kind: "redeem",
        direction: "spend",
        riskStatus: "warning",
        steps: input.steps.map((step, index) => ({
          threshold: step.threshold || index + 1,
          label: step.label,
          score: Math.abs(step.score),
        })),
      };
    }

    return {
      ...base,
      kind: "redeem",
      direction: "spend",
      riskStatus: "warning",
      score,
    };
  }

  if (input.kind === "family-task") {
    return {
      ...base,
      kind: "family-task",
      direction: "gain",
      riskStatus: "safe",
      score,
    };
  }

  if (input.kind === "family-companion") {
    return {
      ...base,
      kind: "family-companion",
      direction: "gain",
      riskStatus: "safe",
      score,
    };
  }

  return {
    ...base,
    kind: input.kind,
    direction: "gain",
    riskStatus: "safe",
    score,
  };
}

async function syncState(set: (partial: Partial<AppState>) => void, rules: RuleDefinition[]) {
  const events = await listEvents();
  set(deriveState(rules, events));
}

function hasCurrentSeedVersion(): boolean {
  return typeof localStorage !== "undefined" && localStorage.getItem(DATA_SEED_VERSION_KEY) === DATA_SEED_VERSION;
}

function markCurrentSeedVersion(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DATA_SEED_VERSION_KEY, DATA_SEED_VERSION);
  }
}

async function resetToDefaultData(): Promise<RuleDefinition[]> {
  await clearEvents();
  await clearDailySummaries();
  await replaceRules(defaultRules);
  markCurrentSeedVersion();
  return [...defaultRules];
}

export const useAppStore = create<AppState>((set, get) => ({
  rules: [],
  events: [],
  dayScore: 0,
  totalScore: 0,
  riskStatus: "danger",
  bootstrap: async () => {
    if (!hasCurrentSeedVersion()) {
      const rules = await resetToDefaultData();
      set({ rules });
      await syncState(set, rules);
      return;
    }

    const persistedRules = await listRules();
    const missingDefaultRules = defaultRules.filter(
      (defaultRule) => !persistedRules.some((rule) => rule.id === defaultRule.id),
    );
    const rules =
      persistedRules.length > 0 ? [...persistedRules, ...missingDefaultRules] : [...defaultRules];

    if (persistedRules.length === 0) {
      await replaceRules(defaultRules);
    } else if (missingDefaultRules.length > 0) {
      await replaceRules(rules);
    }

    set({ rules });
    await syncState(set, rules);
  },
  recordGain: async (ruleId) => {
    const state = get();
    const rule = state.rules.find((item) => item.id === ruleId);

    if (!rule) {
      return { ok: false, reason: "RULE_NOT_FOUND" };
    }

    if (
      rule.kind !== "must" &&
      rule.kind !== "bonus" &&
      rule.kind !== "family-task" &&
      rule.kind !== "family-companion"
    ) {
      return { ok: false, reason: "INVALID_RULE_KIND" };
    }

    if (rule.kind === "must" && state.hasCompletedToday(ruleId)) {
      return { ok: false, reason: "ALREADY_COMPLETED_TODAY" };
    }

    if (rule.dailyCap && state.getTodayCount(ruleId) >= rule.dailyCap) {
      return { ok: false, reason: "DAILY_CAP_REACHED" };
    }

    applyScoreEvent({
      currentDayScore: state.dayScore,
      currentTotalScore: state.totalScore,
      delta: rule.score,
      direction: "gain",
    });

    await addEvent(buildEvent(rule.id, rule.score));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  recordSteppedLoss: async (ruleId, stepIndex) => {
    const state = get();
    const rule = state.rules.find((item) => item.id === ruleId);

    if (!rule) {
      return { ok: false, reason: "RULE_NOT_FOUND" };
    }

    if (rule.kind !== "vice" || !("steps" in rule)) {
      return { ok: false, reason: "INVALID_RULE_KIND" };
    }

    const step = rule.steps[stepIndex];

    if (!step) {
      return { ok: false, reason: "INVALID_STEP" };
    }

    await addEvent(buildEvent(rule.id, step.score));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  recordCustomScore: async (input) => {
    const state = get();
    const scoreDelta = Math.round(input.scoreDelta);

    if (!Number.isFinite(scoreDelta) || scoreDelta === 0) {
      return { ok: false, reason: "INVALID_STEP" };
    }

    await addEvent(buildEvent(`custom-score-${input.itemId}`, scoreDelta));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  redeemRule: async (ruleId) => {
    const state = get();
    const rule = state.rules.find((item) => item.id === ruleId);

    if (!rule) {
      return { ok: false, reason: "RULE_NOT_FOUND" };
    }

    if (rule.kind !== "redeem") {
      return { ok: false, reason: "INVALID_RULE_KIND" };
    }

    const result = redeemItem({
      totalScore: state.totalScore,
      cost: rule.score,
      cooldownSatisfied: isCooldownSatisfied(rule, state.events),
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    await addEvent(buildEvent(rule.id, -rule.score));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  redeemCustom: async (input) => {
    const state = get();
    const cost = Math.max(0, Math.round(input.cost));
    const result = redeemItem({
      totalScore: state.totalScore,
      cost,
      cooldownSatisfied: true,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    await addEvent(buildEvent(`redeem-custom-${input.itemId}`, -cost));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  addFixedRule: async (input) => {
    const state = get();
    const rule = buildCustomRule(input);
    const rules = [...state.rules, rule];

    await putRule(rule);
    set({ rules });
    await syncState(set, rules);
  },
  updateRule: async (rule) => {
    const state = get();
    const rules = state.rules.map((item) => (item.id === rule.id ? rule : item));

    await putRule(rule);
    set({ rules });
    await syncState(set, rules);
  },
  recordFamilyItem: async (input) => {
    const state = get();
    const customRule = state.rules.find(
      (item) =>
        item.id === input.itemId &&
        (item.kind === "family-task" || item.kind === "family-companion"),
    );
    const baseKind =
      input.scoreType === "loss"
        ? "vice"
        : input.scoreType === "companion"
          ? "family-companion"
          : "family-task";
    const rule =
      customRule ??
      (input.scoreType === "loss"
        ? (state.rules.find((item) => item.id === "vice-family-emotion") ??
          defaultRules.find((item) => item.id === "vice-family-emotion"))
        : (state.rules.find((item) => item.kind === baseKind) ??
          defaultRules.find((item) => item.kind === baseKind)));
    const eventRuleId = `family-item-${input.itemId}`;

    if (!rule || !("score" in rule)) {
      return { ok: false, reason: "RULE_NOT_FOUND" };
    }

    if (state.hasCompletedFamilyItemToday(input.itemId)) {
      return { ok: false, reason: "ALREADY_COMPLETED_TODAY" };
    }

    await addEvent(buildEvent(eventRuleId, rule.score));
    await syncState(set, state.rules);

    return { ok: true, reason: null };
  },
  hasCompletedFamilyItemToday: (itemId) => {
    const eventRuleId = `family-item-${itemId}`;

    return get()
      .events.filter((event) => isToday(event.happenedAt))
      .some((event) => event.ruleId === eventRuleId);
  },
  hasCompletedToday: (ruleId) => {
    return get()
      .events.filter((event) => isToday(event.happenedAt))
      .some((event) => isRuleCompletedByEvent(ruleId, event));
  },
  getTodayCount: (ruleId) => {
    return get().events.filter(
      (event) => isToday(event.happenedAt) && event.ruleId === ruleId,
    ).length;
  },
  getRuleName: (ruleId) => {
    return get().rules.find((rule) => rule.id === ruleId)?.name ?? ruleId;
  },
  getRedeemStatus: (ruleId) => {
    const state = get();
    const rule = state.rules.find((item) => item.id === ruleId);

    if (!rule || rule.kind !== "redeem") {
      return { disabled: true, reason: "INVALID_RULE_KIND" as const };
    }

    if (!isCooldownSatisfied(rule, state.events)) {
      return { disabled: true, reason: "COOLDOWN_ACTIVE" as const };
    }

    if (state.totalScore < rule.score) {
      return { disabled: true, reason: "INSUFFICIENT_SCORE" as const };
    }

    return { disabled: false, reason: null };
  },
}));
