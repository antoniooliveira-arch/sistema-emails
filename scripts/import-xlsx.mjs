import XLSX from "xlsx";
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

// Uso: node --env-file=.env.local scripts/import-xlsx.mjs <arquivo.xlsx>
// Cada aba = uma secretaria; o nome da aba é usado como secretaria.
// A primeira linha de cada aba deve ser o cabeçalho; as demais, os e-mails.
const file = process.argv[2] ?? "planilha-emails.xlsx";

const wb = XLSX.readFile(file);

async function main() {
  await client.connect();
  let total = 0;
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const emails = rows
      .slice(1)
      .map((r) => String(r[0]).trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length === 0) {
      console.log(`⚠ Aba "${sheetName}" sem e-mails válidos — ignorada.`);
      continue;
    }

    for (const email of emails) {
      await client.query(
        `INSERT INTO public.emails_institucionais (secretaria, email, situacao)
         VALUES ($1, $2, 'nao_localizado')
         ON CONFLICT (email) DO UPDATE SET secretaria = EXCLUDED.secretaria`,
        [sheetName.trim(), email]
      );
    }
    total += emails.length;
    console.log(`✔ ${sheetName}: ${emails.length} e-mails`);
  }
  const { rows: count } = await client.query(
    "SELECT COUNT(*)::int AS total FROM public.emails_institucionais"
  );
  console.log(`Importação concluída: ${total} e-mails processados. Total na tabela: ${count[0].total}.`);
  await client.end();
}

main().catch((err) => {
  console.error("Erro na importação:", err.message);
  process.exit(1);
});