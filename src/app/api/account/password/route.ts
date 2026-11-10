import { NextResponse } from "next/server";
import { changeOwnPassword } from "@/lib/auth";
import { requireUser } from "@/lib/current-user";
import { assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const body = (await readJson(req)) as { currentPassword?: string; nextPassword?: string };
    await changeOwnPassword(user, String(body.currentPassword || ""), String(body.nextPassword || ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
