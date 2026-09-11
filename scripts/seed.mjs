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

const emails = [
  {
    secretaria: "Secretaria Municipal de Educação",
    email: "alfabetiza.smec@juina.mt.gov.br",
    setor: "Alfabetização",
    responsavel: null,
    cargo: null,
    situacao: "em_uso_atualizar_responsavel",
    observacao: "E-mail de exemplo — aguardando informação do responsável.",
  },
  {
    secretaria: "Secretaria Municipal de Educação",
    email: "compras.smec@juina.mt.gov.br",
    setor: null,
    responsavel: null,
    cargo: null,
    situacao: "nao_localizado",
    observacao: "E-mail de exemplo — aguardando preenchimento do levantamento.",
  },
];

async function main() {
  await client.connect();
  for (const e of emails) {
    await client.query(
      `INSERT INTO public.emails_institucionais
         (secretaria, email, setor, responsavel, cargo, situacao, observacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [e.secretaria, e.email, e.setor, e.responsavel, e.cargo, e.situacao, e.observacao]
    );
  }
  const { rows } = await client.query("SELECT COUNT(*)::int AS total FROM public.emails_institucionais");
  console.log(`Seed concluído. ${rows[0].total} e-mails cadastrados no Supabase.`);
  await client.end();
}

main().catch((err) => {
  console.error("Erro ao popular os dados:", err.message);
  process.exit(1);
});