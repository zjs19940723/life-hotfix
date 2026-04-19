import { db, type PersistedEvent } from "../db";

export type CreateEventInput = Omit<PersistedEvent, "id">;

export async function addEvent(event: CreateEventInput): Promise<number> {
  return db.events.add(event);
}

export async function listEvents(): Promise<PersistedEvent[]> {
  return db.events.toArray();
}

export async function clearEvents(): Promise<void> {
  await db.events.clear();
}
