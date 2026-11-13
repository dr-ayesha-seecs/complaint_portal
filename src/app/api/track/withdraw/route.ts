import { NextResponse } from "next/server";
import { withdrawComplaint } from "@/lib/complaints";
import { appUrlFromRequest, assertSameOrigin, clientIp, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = (await readJson(req)) as { trackingNumber?: string; secretKey?: string };
    const result = await withdrawComplaint(
      String(body.trackingNumber || ""),
      String(body.secretKey || ""),
      clientIp(req),
      appUrlFromRequest(req),
    );
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
