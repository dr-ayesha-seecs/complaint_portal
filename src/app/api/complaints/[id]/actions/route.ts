import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { applyComplaintAction } from "@/lib/complaints";
import { appUrlFromRequest, assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await readJson(req)) as {
      type?: "status" | "note" | "respond" | "escalate" | "rotate_secret";
      status?: string;
      message?: string;
      note?: string;
      confirmedIdentity?: boolean;
    };
    if (!body.type) return NextResponse.json({ error: "Choose an action." }, { status: 400 });
    const result = await applyComplaintAction(
      user,
      id,
      {
        type: body.type,
        status: body.status,
        message: body.message,
        note: body.note,
        confirmedIdentity: body.confirmedIdentity,
      },
      appUrlFromRequest(req),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
