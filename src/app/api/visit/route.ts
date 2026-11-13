import { NextResponse } from "next/server";
import { assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";
import { recordVisit } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = (await readJson(req)) as { path?: unknown };
    const path = typeof body.path === "string" ? body.path : "";
    await recordVisit(path);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
