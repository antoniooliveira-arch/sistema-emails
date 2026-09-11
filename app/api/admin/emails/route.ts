import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authorized = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.toString().trim() ?? "";
  const secretaria = body?.secretaria?.toString().trim() ?? "";

  if (!email || !secretaria) {
    return NextResponse.json({ error: "Informe a secretaria e o e-mail" }, { status: 400 });
  }

  try {
    const result = await query(
      `INSERT INTO public.emails_institucionais (secretaria, email, situacao)
       VALUES ($1, $2, 'nao_localizado')
       RETURNING id`,
      [secretaria, email]
    );
    return NextResponse.json({ ok: true, id: result[0].id }, { status: 201 });
  } catch (err) {
    const msg = (err as { message?: string }).message ?? "";
    if (msg.includes("duplicate")) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao cadastrar o e-mail" }, { status: 500 });
  }
}