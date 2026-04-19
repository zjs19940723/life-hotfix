import { db, type DailySummary } from "../db";

export async function putDailySummary(summary: DailySummary): Promise<string> {
  await db.dailySummaries.put(summary);
  return summary.date;
}

export async function listDailySummaries(): Promise<DailySummary[]> {
  return db.dailySummaries.toArray();
}

export async function clearDailySummaries(): Promise<void> {
  await db.dailySummaries.clear();
}
