-- ============================================================
-- Sistema de Controle de E-mails Institucionais
-- Migração do banco de dados Supabase
-- ============================================================

-- Tabela principal de e-mails institucionais
CREATE TABLE IF NOT EXISTS public.emails_institucionais (
  id BIGSERIAL PRIMARY KEY,
  secretaria TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  setor TEXT,
  responsavel TEXT,
  cargo TEXT,
  situacao TEXT NOT NULL DEFAULT 'nao_localizado'
    CONSTRAINT situacao_check CHECK (situacao IN (
      'em_uso',
      'em_uso_atualizar_responsavel',
      'nao_utilizado',
      'desativado',
      'nao_localizado'
    )),
  encaminhado BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas por secretaria e situação
CREATE INDEX IF NOT EXISTS idx_emails_secretaria ON public.emails_institucionais (secretaria);
CREATE INDEX IF NOT EXISTS idx_emails_situacao   ON public.emails_institucionais (situacao);

-- Tabela de registro de atualizações (histórico)
CREATE TABLE IF NOT EXISTS public.historico_emails (
  id BIGSERIAL PRIMARY KEY,
  email_id BIGINT NOT NULL REFERENCES public.emails_institucionais (id) ON DELETE CASCADE,
  setor TEXT,
  responsavel TEXT,
  cargo TEXT,
  situacao TEXT,
  observacao TEXT,
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_email_id ON public.historico_emails (email_id);