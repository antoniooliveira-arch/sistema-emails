# Sistema de Controle de E-mails Institucionais

Formulário web para o levantamento dos e-mails institucionais (por secretaria e setor)
com banco de dados no **Supabase (PostgreSQL)**, painel administrativo e exportação em CSV.

## Tecnologias

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase / PostgreSQL
- Deploy sugerido: Vercel + GitHub

## Estrutura

```
sistema-emails/
├── app/
│   ├── page.tsx              # Formulário público de levantamento
│   ├── admin/page.tsx        # Painel administrativo (com login)
│   └── api/                  # Rotas de API (REST)
├── components/
│   ├── FormularioEmail.tsx   # Formulário de levantamento
│   ├── AdminPanel.tsx        # Relatório por secretaria/setor/e-mail
│   └── LoginForm.tsx         # Login do painel admin
├── lib/
│   ├── db.ts                 # Conexão com o banco (pg)
│   ├── auth.ts               # Autenticação do painel admin
│   └── types.ts              # Tipos e situações do e-mail
├── sql/schema.sql            # Migração do banco de dados
└── scripts/                  # Scripts de banco (migrar, seed, importar CSV)
```

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env.local` a partir de `.env.example` e preencha com as
credenciais do Supabase (host, senha) e a senha do painel admin:

```bash
cp .env.example .env.local
```

3. Aplique o schema e popule com dados iniciais:

```bash
npm run db:migrate   # cria as tabelas no Supabase
npm run db:seed      # (opcional) insere e-mails de exemplo
```

Importar os 51 e-mails a partir de uma planilha CSV (colunas `secretaria;email`):

```bash
npm run db:import -- planilha-emails.csv
```

4. Execute a aplicação:

```bash
npm run dev
```

- Formulário: http://localhost:3000
- Painel admin: http://localhost:3000/admin (senha definida em `ADMIN_PASSWORD`)

## Considerações de segurança

- O arquivo `.env.local` contém a senha do banco e **não é enviado ao GitHub**
  (veja `.gitignore`). No deploy do Vercel, configure as mesmas variáveis em
  **Settings → Environment Variables**.
- O painel admin é protegido por senha (cookie httpOnly). Para ambientes de
  produção com várias secretarias, recomenda-se substituir pela autenticação
  do Supabase Auth.