import { NextResponse } from "next/server";
import { ensureDatabase, getClient } from "@/lib/db";
import { mailMode } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    await getClient().execute("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, mail: mailMode() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
