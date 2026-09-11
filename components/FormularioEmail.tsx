"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmailInstitucional, SecretariaResumo } from "@/lib/types";
import { situacoes } from "@/lib/types";

type Mensagem =
  | { tipo: "sucesso" | "erro"; texto: string }
  | null;

export default function FormularioEmail() {
  const [secretarias, setSecretarias] = useState<SecretariaResumo[]>([]);
  const [secretaria, setSecretaria] = useState("");
  const [emails, setEmails] = useState<EmailInstitucional[]>([]);
  const [emailId, setEmailId] = useState("");
  const [emailAtual, setEmailAtual] = useState<EmailInstitucional | null>(null);

  const [setor, setSetor] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [cargo, setCargo] = useState("");
  const [situacao, setSituacao] = useState("em_uso");
  const [observacao, setObservacao] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  const carregarEmails = useCallback(async (nomeSecretaria: string) => {
    const res = await fetch(`/api/emails?secretaria=${encodeURIComponent(nomeSecretaria)}`);
    if (!res.ok) return;
    setEmails(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/secretarias")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSecretarias);
  }, []);

  useEffect(() => {
    if (!mensagem || mensagem.tipo !== "sucesso") return;
    const timer = setTimeout(() => setMensagem(null), 5000);
    return () => clearTimeout(timer);
  }, [mensagem]);

  function aoTrocarSecretaria(nome: string) {
    setSecretaria(nome);
    setEmailId("");
    setEmailAtual(null);
    limparCampos();
    if (nome) carregarEmails(nome);
  }

  function limparCampos() {
    setSetor("");
    setResponsavel("");
    setCargo("");
    setSituacao("em_uso");
    setObservacao("");
  }

  function aoSelecionarEmail(id: string) {
    setEmailId(id);
    const atual = emails.find((e) => String(e.id) === String(id)) ?? null;
    setEmailAtual(atual);
    if (atual) {
      setSetor(atual.setor ?? "");
      setResponsavel(atual.responsavel ?? "");
      setCargo(atual.cargo ?? "");
      setSituacao(atual.situacao);
      setObservacao(atual.observacao ?? "");
    } else {
      limparCampos();
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!emailId) {
      setMensagem({ tipo: "erro", texto: "Selecione um e-mail para salvar as informações." });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setor, responsavel, cargo, situacao, observacao }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: data.error ?? "Erro ao salvar." });
      } else {
        const salvoEmail = emailAtual?.email ?? "";
        const indice = emails.findIndex((e) => String(e.id) === String(emailId));
        const proximoEmail = indice >= 0 ? emails[indice + 1] ?? null : null;

        carregarEmails(secretaria);

        limparCampos();
        if (proximoEmail) {
          aoSelecionarEmail(String(proximoEmail.id));
          limparCampos();
          setMensagem({
            tipo: "sucesso",
            texto: `Registro concluído! E-mail ${salvoEmail} salvo. Próximo: ${proximoEmail.email}`,
          });
        } else {
          setMensagem({
            tipo: "sucesso",
            texto: `Registro concluído! E-mail ${salvoEmail} salvo. Este foi o último da lista.`,
          });
        }
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha de conexão. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {mensagem && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            mensagem.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <span className="text-lg leading-none">
            {mensagem.tipo === "sucesso" ? "✅" : "⚠️"}
          </span>
          <span>{mensagem.texto}</span>
        </div>
      )}

      <form
        onSubmit={salvar}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Secretaria</span>
          <select
            value={secretaria}
            onChange={(e) => aoTrocarSecretaria(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Selecione a secretaria…</option>
            {secretarias.map((s) => (
              <option key={s.secretaria} value={s.secretaria}>
                {s.secretaria}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">E-mail</span>
          <select
            value={emailId}
            onChange={(e) => aoSelecionarEmail(e.target.value)}
            required
            disabled={!secretaria}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-zinc-100"
          >
            <option value="">Selecione o e-mail…</option>
            {emails.map((e) => (
              <option key={e.id} value={e.id}>
                {e.email}
              </option>
            ))}
          </select>
        </label>
      </div>

      {emailAtual && (
        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Última atualização:{" "}
          {emailAtual.atualizado_em
            ? new Date(emailAtual.atualizado_em).toLocaleString("pt-BR")
            : "nunca"}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Setor que utiliza</span>
        <input
          type="text"
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          placeholder="Ex.: Departamento de Compras"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Quem utiliza este e-mail?</span>
        <input
          type="text"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          placeholder="Nome do responsável"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Cargo/Função</span>
        <input
          type="text"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Ex.: Coordenador(a)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-zinc-700">Situação do e-mail</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {situacoes.map((s) => {
            const ativo = situacao === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSituacao(s.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  ativo
                    ? "border-blue-500 bg-blue-50 font-medium text-blue-700 ring-2 ring-blue-200"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Observações</span>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          placeholder="Observações sobre o e-mail…"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar informações"}
        </button>
      </div>
      </form>
    </>
  );
}