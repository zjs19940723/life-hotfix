import { db } from "../db";
import type { RuleDefinition } from "../../domain/types";

export async function listRules(): Promise<RuleDefinition[]> {
  return db.rules.toArray();
}

export async function replaceRules(rules: readonly RuleDefinition[]): Promise<void> {
  await db.transaction("rw", db.rules, async () => {
    await db.rules.clear();
    await db.rules.bulkPut([...rules]);
  });
}

export async function putRule(rule: RuleDefinition): Promise<void> {
  await db.rules.put(rule);
}
