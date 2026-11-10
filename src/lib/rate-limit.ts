import { getClient } from "./db";
import { HttpError } from "./http";

export async function assertRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const db = getClient();
  const now = Date.now();
  const cutoff = now - windowMs;
  await db.execute({
    sql: `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
          ON CONFLICT(key) DO UPDATE SET
            count = CASE WHEN rate_limits.window_start < ? THEN 1 ELSE rate_limits.count + 1 END,
            window_start = CASE WHEN rate_limits.window_start < ? THEN ? ELSE rate_limits.window_start END`,
    args: [key, now, cutoff, cutoff, now],
  });
  const row = await db.execute({ sql: "SELECT count FROM rate_limits WHERE key = ?", args: [key] });
  if (Number(row.rows[0]?.count ?? 0) > limit) {
    throw new HttpError(429, "Too many requests. Please wait a little and try again.");
  }
}
