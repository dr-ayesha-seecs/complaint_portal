import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";
import { appUrlFromRequest, assertSameOrigin, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const jar = await cookies();
    await destroySession(jar.get(SESSION_COOKIE)?.value);
    const response = NextResponse.redirect(new URL("/login", appUrlFromRequest(req)), 303);
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
