import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pkg from "pg";

const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function main() {
  await client.connect();
  const sql = readFileSync(join(__dirname, "..", "sql", "schema.sql"), "utf8");
  await client.query(sql);
  console.log("Schema aplicado com sucesso no Supabase.");
  await client.end();
}

main().catch((err) => {
  console.error("Erro ao aplicar o schema:", err.message);
  process.exit(1);
});