import { NextResponse } from "next/server";
import { submitComplaint } from "@/lib/complaints";
import { appUrlFromRequest, assertSameOrigin, clientIp, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const form = await req.formData();
    let payload: unknown = {};
    try {
      payload = JSON.parse(String(form.get("payload") || "{}"));
    } catch {
      payload = {};
    }
    const files: { filename: string; bytes: Uint8Array }[] = [];
    for (const entry of form.getAll("files")) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      files.push({ filename: entry.name, bytes: new Uint8Array(await entry.arrayBuffer()) });
    }
    const turnstileToken = String(form.get("turnstileToken") || "");
    const result = await submitComplaint(payload, files, {
      ip: clientIp(req),
      appUrl: appUrlFromRequest(req),
      turnstileToken: turnstileToken || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
