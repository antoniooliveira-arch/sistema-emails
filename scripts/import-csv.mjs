import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import pkg from "pg";

const { Client } = pkg;

const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  ssl:
    process.env.SUPABASE_DB_SSL === "true" || process.env.SUPABASE_DB_SSL === "1"
      ? { rejectUnauthorized: false }
      : false,
});

// Uso: node --env-file=.env.local scripts/import-csv.mjs <arquivo.csv>
// CSV esperado (separador ;):
//   secretaria;email
// Pode incluir também: setor;responsavel;cargo;situacao;observacao
const file = process.argv[2] ?? "planilha-emails.csv";

const rows = parse(readFileSync(file, "utf8"), {
  delimiter: ";",
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

async function main() {
  await client.connect();
  let inseridos = 0;
  for (const r of rows) {
    if (!r.email) continue;
    const situacao = ["em_uso","em_uso_atualizar_responsavel","nao_utilizado","desativado","nao_localizado"]
      .includes(r.situacao) ? r.situacao : "nao_localizado";
    const res = await client.query(
      `INSERT INTO public.emails_institucionais
         (secretaria, email, setor, responsavel, cargo, situacao, observacao)
       VALUES ($1, $2, NULLIF($3,''), NULLIF($4,''), NULLIF($5,''), $6, NULLIF($7,''))
       ON CONFLICT (email) DO UPDATE SET
         secretaria = EXCLUDED.secretaria,
         setor       = COALESCE(EXCLUDED.setor, public.emails_institucionais.setor),
         responsavel = COALESCE(EXCLUDED.responsavel, public.emails_institucionais.responsavel),
         cargo       = COALESCE(EXCLUDED.cargo, public.emails_institucionais.cargo),
         situacao    = CASE WHEN EXCLUDED.situacao = 'nao_localizado'
                            THEN public.emails_institucionais.situacao
                            ELSE EXCLUDED.situacao END,
         observacao  = COALESCE(EXCLUDED.observacao, public.emails_institucionais.observacao)`,
      [r.secretaria, r.email, r.setor ?? "", r.responsavel ?? "", r.cargo ?? "", situacao, r.observacao ?? ""]
    );
    inseridos += res.rowCount ?? 0;
  }
  const { rows: count } = await client.query("SELECT COUNT(*)::int AS total FROM public.emails_institucionais");
  console.log(`Importação concluída: ${inseridos} registros processados. Total na tabela: ${count[0].total}.`);
  await client.end();
}

main().catch((err) => {
  console.error("Erro na importação:", err.message);
  process.exit(1);
});