import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { readAttachment } from "@/lib/complaints";
import { toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const file = await readAttachment(user, id);
    const filename = file.filename.replace(/["\r\n]/g, "");
    return new NextResponse(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
