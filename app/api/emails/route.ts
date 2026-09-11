import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { EmailInstitucional } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secretaria = request.nextUrl.searchParams.get("secretaria");
  if (!secretaria) {
    return NextResponse.json({ error: "Parâmetro 'secretaria' é obrigatório" }, { status: 400 });
  }
  const emails = await query<EmailInstitucional>(
    `SELECT id, secretaria, email, setor, responsavel, cargo, situacao, encaminhado, observacao, atualizado_em
     FROM public.emails_institucionais
     WHERE secretaria = $1
     ORDER BY email`,
    [secretaria]
  );
  return NextResponse.json(emails);
}