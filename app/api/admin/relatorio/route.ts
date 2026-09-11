import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { EmailInstitucional } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorized = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const condicoes: string[] = [];
  const valores: unknown[] = [];

  const secretaria = params.get("secretaria");
  if (secretaria) {
    valores.push(secretaria);
    condicoes.push(`secretaria = $${valores.length}`);
  }

  const setor = params.get("setor");
  if (setor) {
    valores.push(`%${setor}%`);
    condicoes.push(`COALESCE(setor, '') ILIKE $${valores.length}`);
  }

  const situacao = params.get("situacao");
  if (situacao) {
    valores.push(situacao);
    condicoes.push(`situacao = $${valores.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

  const emails = await query<EmailInstitucional>(
    `SELECT id, secretaria, email, setor, responsavel, cargo, situacao, observacao, atualizado_em
     FROM public.emails_institucionais
     ${where}
     ORDER BY secretaria, email`,
    valores
  );

  const ativas = await query<{ total: number; utilizadas: number; pendentes: number }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE situacao IN ('em_uso','em_uso_atualizar_responsavel'))::int AS utilizadas,
            COUNT(*) FILTER (WHERE situacao = 'nao_localizado' AND setor IS NULL)::int AS pendentes
     FROM public.emails_institucionais`
  );

  return NextResponse.json({ emails, resumo: ativas[0] });
}