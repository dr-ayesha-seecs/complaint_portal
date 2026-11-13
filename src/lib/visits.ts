import { ensureDatabase, getClient } from "./db";
import { HttpError } from "./http";
import { isPublicVisitPath, karachiDay } from "./visit-paths";

export { PUBLIC_VISIT_PATHS, isPublicVisitPath, karachiDay } from "./visit-paths";
export type { PublicVisitPath } from "./visit-paths";

export async function recordVisit(path: string): Promise<void> {
  if (!isPublicVisitPath(path)) throw new HttpError(400, "That page is not counted.");
  await ensureDatabase();
  await getClient().execute({
    sql: `INSERT INTO page_visit_counts (day, path, count) VALUES (?, ?, 1)
          ON CONFLICT(day, path) DO UPDATE SET count = count + 1`,
    args: [karachiDay(), path],
  });
}

export async function visitStats(): Promise<{ total: number; today: number }> {
  await ensureDatabase();
  const day = karachiDay();
  const total = await getClient().execute("SELECT COALESCE(SUM(count), 0) AS n FROM page_visit_counts");
  const today = await getClient().execute({
    sql: "SELECT COALESCE(SUM(count), 0) AS n FROM page_visit_counts WHERE day = ?",
    args: [day],
  });
  return {
    total: Number(total.rows[0]?.n ?? 0),
    today: Number(today.rows[0]?.n ?? 0),
  };
}
