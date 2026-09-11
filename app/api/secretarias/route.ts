import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { SecretariaResumo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const secretarias = await query<SecretariaResumo>(
    `SELECT secretaria,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE situacao <> 'nao_localizado' OR setor IS NOT NULL)::int AS preenchidos
     FROM public.emails_institucionais
     GROUP BY secretaria
     ORDER BY secretaria`
  );
  return NextResponse.json(secretarias);
}