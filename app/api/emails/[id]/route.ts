import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { situacoes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/emails/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const emailId = Number(id);
  if (!Number.isInteger(emailId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const setor = (body.setor ?? "").toString().trim() || null;
  const responsavel = (body.responsavel ?? "").toString().trim() || null;
  const cargo = (body.cargo ?? "").toString().trim() || null;
  const situacao = body.situacao?.toString() ?? "em_uso";
  const observacao = (body.observacao ?? "").toString().trim() || null;

  if (!situacoes.some((s) => s.value === situacao)) {
    return NextResponse.json({ error: "Situação inválida" }, { status: 400 });
  }

  const existente = await query<{ encaminhado: boolean }>(
    `SELECT encaminhado FROM public.emails_institucionais WHERE id = $1`,
    [emailId]
  );

  if (existente.length === 0) {
    return NextResponse.json({ error: "E-mail não encontrado" }, { status: 404 });
  }

  if (existente[0].encaminhado) {
    return NextResponse.json(
      { error: "Formulário já encaminhado para este e-mail. Não é permitido gerar duplicidade." },
      { status: 409 }
    );
  }

  const result = await query(
    `UPDATE public.emails_institucionais
     SET setor = $1, responsavel = $2, cargo = $3, situacao = $4, observacao = $5, encaminhado = true, atualizado_em = now()
     WHERE id = $6
     RETURNING id`,
    [setor, responsavel, cargo, situacao, observacao, emailId]
  );

  if (result.length === 0) {
    return NextResponse.json({ error: "E-mail não encontrado" }, { status: 404 });
  }

  await query(
    `INSERT INTO public.historico_emails (email_id, setor, responsavel, cargo, situacao, observacao)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [emailId, setor, responsavel, cargo, situacao, observacao]
  );

  return NextResponse.json({ ok: true, id: emailId });
}