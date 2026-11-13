import { NextResponse } from "next/server";
import { updateUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/current-user";
import { HttpError, assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";
import { canManageUsers, isRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const actor = await requireUser();
    if (!canManageUsers(actor)) throw new HttpError(403, "Only a system administrator can change accounts.");
    const { id } = await context.params;
    const body = (await readJson(req)) as {
      active?: boolean;
      password?: string;
      role?: string;
      facultyId?: string | null;
      departmentId?: string | null;
    };
    if (body.role && !isRole(body.role)) throw new HttpError(400, "Choose a valid role.");
    await updateUser(actor, id, {
      active: body.active,
      password: body.password || undefined,
      role: body.role && isRole(body.role) ? body.role : undefined,
      facultyId: body.facultyId === undefined ? undefined : body.facultyId || null,
      departmentId: body.departmentId === undefined ? undefined : body.departmentId || null,
    });
    await audit({
      actorId: actor.id,
      action: "user_updated",
      entity: "user",
      entityId: id,
      meta: { active: body.active ?? null, role: body.role ?? null, passwordReset: Boolean(body.password) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
