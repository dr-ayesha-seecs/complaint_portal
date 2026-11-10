import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { exportComplaints } from "@/lib/complaints";
import type { ComplaintFilters } from "@/lib/view-types";
import { assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const filters = (await readJson(req)) as ComplaintFilters;
    const csv = await exportComplaints(user, filters);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"mnsuam-complaints.csv\"",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
