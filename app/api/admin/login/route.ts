import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminToken, isAdminPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password?.toString() ?? "";

  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const store = await cookies();
  store.set("admin_token", adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}