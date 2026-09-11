export type Situacao =
  | "em_uso"
  | "em_uso_atualizar_responsavel"
  | "nao_utilizado"
  | "desativado"
  | "nao_localizado";

export const situacoes: { value: Situacao; label: string; emoji: string; cor: string }[] = [
  { value: "em_uso", label: "Em uso", emoji: "🟢", cor: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  {
    value: "em_uso_atualizar_responsavel",
    label: "Em uso, mas precisa atualizar responsável",
    emoji: "🟡",
    cor: "text-yellow-600 bg-yellow-50 ring-yellow-200",
  },
  { value: "nao_utilizado", label: "Não utilizado", emoji: "🔴", cor: "text-red-600 bg-red-50 ring-red-200" },
  { value: "desativado", label: "Desativar", emoji: "⚫", cor: "text-zinc-600 bg-zinc-100 ring-zinc-300" },
  { value: "nao_localizado", label: "Não localizado", emoji: "🔵", cor: "text-blue-600 bg-blue-50 ring-blue-200" },
];

export function situacaoInfo(value: string) {
  return (
    situacoes.find((s) => s.value === value) ?? {
      value,
      label: value,
      emoji: "❔",
      cor: "text-zinc-600 bg-zinc-100 ring-zinc-300",
    }
  );
}

export type EmailInstitucional = {
  id: number;
  secretaria: string;
  email: string;
  setor: string | null;
  responsavel: string | null;
  cargo: string | null;
  situacao: Situacao;
  observacao: string | null;
  atualizado_em: string | null;
};

export type SecretariaResumo = {
  secretaria: string;
  total: number;
  preenchidos: number;
};