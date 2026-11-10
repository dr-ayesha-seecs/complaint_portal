import { NextResponse } from "next/server";
import { appealComplaint } from "@/lib/complaints";
import { appUrlFromRequest, assertSameOrigin, clientIp, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = (await readJson(req)) as { trackingNumber?: string; secretKey?: string; grounds?: string };
    await appealComplaint(
      String(body.trackingNumber || ""),
      String(body.secretKey || ""),
      String(body.grounds || ""),
      clientIp(req),
      appUrlFromRequest(req),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
