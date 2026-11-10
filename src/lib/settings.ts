import { getClient } from "./db";
import { isPlaceholderEmail } from "./ids";

export async function getSetting(key: string): Promise<string | null> {
  const row = await getClient().execute({ sql: "SELECT value FROM settings WHERE key = ?", args: [key] });
  if (!row.rows[0]) return null;
  return String(row.rows[0].value);
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getClient().execute({
    sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, value.trim(), new Date().toISOString()],
  });
}

export type HarassmentSettings = {
  focalName: string;
  focalEmail: string;
  committeeEmail: string;
  vcEmail: string;
};

export async function harassmentSettings(): Promise<HarassmentSettings> {
  const [focalName, focalEmail, committeeEmail, vcEmail] = await Promise.all([
    getSetting("harassment_focal_name"),
    getSetting("harassment_focal_email"),
    getSetting("harassment_committee_email"),
    getSetting("vc_notification_email"),
  ]);
  return {
    focalName: focalName || "Harassment Focal Person",
    focalEmail: focalEmail || "",
    committeeEmail: committeeEmail || "",
    vcEmail: vcEmail || "",
  };
}

export function placeholderFlag(email: string): number {
  return isPlaceholderEmail(email) ? 1 : 0;
}
