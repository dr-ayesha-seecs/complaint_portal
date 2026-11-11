import { NextResponse } from "next/server";
import { insertUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/current-user";
import { HttpError, assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";
import { canManageUsers, isRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser();
    if (!canManageUsers(actor)) throw new HttpError(403, "Only a system administrator can create accounts.");
    const body = (await readJson(req)) as {
      email?: string;
      name?: string;
      password?: string;
      role?: string;
      facultyId?: string;
      departmentId?: string;
    };
    if (!body.role || !isRole(body.role)) throw new HttpError(400, "Choose a valid role.");
    const user = await insertUser({
      email: body.email || "",
      name: body.name || "",
      password: body.password || "",
      role: body.role,
      facultyId: body.facultyId?.trim() || null,
      departmentId: body.departmentId?.trim() || null,
    });
    await audit({ actorId: actor.id, action: "user_created", entity: "user", entityId: user.id, meta: { role: user.role } });
    return NextResponse.json({ ok: true, id: user.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
