import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { authenticate, createSession, SESSION_COOKIE } from "@/lib/auth";
import { ensureDatabase } from "@/lib/db";
import { assertSameOrigin, clientIp, readJson, toErrorResponse } from "@/lib/http";
import { hashIp } from "@/lib/ids";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await ensureDatabase();
    const body = (await readJson(req)) as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const ip = clientIp(req);
    const ipHash = hashIp(ip) ?? ip;
    const emailHash = createHash("sha256").update(email).digest("hex");
    await assertRateLimit(`login:${ipHash}`, 10, 15 * 60 * 1000);
    await assertRateLimit(`login-email:${emailHash}`, 10, 15 * 60 * 1000);
    const user = await authenticate(email, password, hashIp(ip));
    if (!user) {
      return NextResponse.json({ error: "The email or password is not correct." }, { status: 401 });
    }
    const token = await createSession(user.id);
    const response = NextResponse.json({ ok: true, name: user.name, role: user.role });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
