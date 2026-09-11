import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/admin/emails/[id]">) {
  const authorized = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const emailId = Number(id);
  if (!Number.isInteger(emailId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await query("DELETE FROM public.emails_institucionais WHERE id = $1", [emailId]);
  return NextResponse.json({ ok: true });
}