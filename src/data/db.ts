import Dexie, { type Table } from "dexie";
import type { RuleDefinition, RiskStatus } from "../domain/types";

export interface PersistedEvent {
  id?: number;
  ruleId: string;
  scoreDelta: number;
  happenedAt: string;
  note?: string;
}

export interface DailySummary {
  date: string;
  dayScore: number;
  totalScore: number;
  riskStatus: RiskStatus;
}

class LifeHotfixDb extends Dexie {
  rules!: Table<RuleDefinition, string>;
  events!: Table<PersistedEvent, number>;
  dailySummaries!: Table<DailySummary, string>;

  constructor() {
    super("life-hotfix");
    this.version(1).stores({
      rules: "id,kind,enabledByDefault",
      events: "++id,ruleId,happenedAt",
      dailySummaries: "date",
    });
  }
}

export const db = new LifeHotfixDb();
