import { NextResponse } from "next/server";
import { trackComplaint } from "@/lib/complaints";
import { assertSameOrigin, clientIp, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = (await readJson(req)) as { trackingNumber?: string; secretKey?: string };
    const view = await trackComplaint(String(body.trackingNumber || ""), String(body.secretKey || ""), clientIp(req));
    return NextResponse.json(view);
  } catch (error) {
    return toErrorResponse(error);
  }
}
