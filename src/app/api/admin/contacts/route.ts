import { NextResponse } from "next/server";
import { addDepartment, updateDepartmentContact, updateFacultyContact, updateHarassmentContacts } from "@/lib/admin";
import { requireUser } from "@/lib/current-user";
import { assertSameOrigin, readJson, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const body = (await readJson(req)) as Record<string, string>;
    if (body.action === "faculty") {
      await updateFacultyContact(user, body.id || "", { deanName: body.deanName || "", deanEmail: body.deanEmail || "" });
    } else if (body.action === "department") {
      await updateDepartmentContact(user, body.id || "", {
        chairpersonName: body.chairpersonName || "",
        chairpersonEmail: body.chairpersonEmail || "",
      });
    } else if (body.action === "add-department") {
      await addDepartment(user, {
        facultyId: body.facultyId || "",
        name: body.name || "",
        chairpersonName: body.chairpersonName || "",
        chairpersonEmail: body.chairpersonEmail || "",
      });
    } else if (body.action === "harassment") {
      await updateHarassmentContacts(user, {
        focalName: body.focalName || "",
        focalEmail: body.focalEmail || "",
        committeeEmail: body.committeeEmail || "",
        vcEmail: body.vcEmail || "",
      });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
