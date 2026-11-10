import { randomUUID } from "crypto";
import { getClient } from "./db";

export async function audit(entry: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipHash?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  await getClient().execute({
    sql: `INSERT INTO audit_logs (id, actor_id, action, entity, entity_id, ip_hash, meta, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      entry.actorId ?? null,
      entry.action,
      entry.entity,
      entry.entityId ?? null,
      entry.ipHash ?? null,
      entry.meta ? JSON.stringify(entry.meta) : null,
      new Date().toISOString(),
    ],
  });
}
