"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailInstitucional } from "@/lib/types";
import { situacoes, situacaoInfo } from "@/lib/types";

type Resumo = { total: number; utilizadas: number; pendentes: number };

export default function AdminPanel() {
  const router = useRouter();

  const [emails, setEmails] = useState<EmailInstitucional[]>([]);
  const [resumo, setResumo] = useState<Resumo>({ total: 0, utilizadas: 0, pendentes: 0 });
  const [secretarias, setSecretarias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [fSecretaria, setFSecretaria] = useState("");
  const [fSetor, setFSetor] = useState("");
  const [fSituacao, setFSituacao] = useState("");

  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [novaSecretaria, setNovaSecretaria] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [msg, setMsg] = useState("");

  const obterRelatorio = useCallback(async () => {
    const params = new URLSearchParams();
    if (fSecretaria) params.set("secretaria", fSecretaria);
    if (fSetor) params.set("setor", fSetor);
    if (fSituacao) params.set("situacao", fSituacao);
    const res = await fetch(`/api/admin/relatorio${params.size ? `?${params}` : ""}`);
    return res.ok ? await res.json() : null;
  }, [fSecretaria, fSetor, fSituacao]);

  async function carregar() {
    setCarregando(true);
    const data = await obterRelatorio();
    if (data) {
      setEmails(data.emails);
      setResumo(data.resumo);
    }
    setCarregando(false);
  }

  useEffect(() => {
    fetch("/api/secretarias")
      .then((r) => (r.ok ? r.json() : []))
      .then((itens: { secretaria: string }[]) => setSecretarias(itens.map((i) => i.secretaria)));
  }, []);

  useEffect(() => {
    let ativo = true;
    obterRelatorio().then((data) => {
      if (!ativo) return;
      if (data) {
        setEmails(data.emails);
        setResumo(data.resumo);
        setCarregando(false);
      }
    });
    return () => {
      ativo = false;
    };
  }, [obterRelatorio]);

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function cadastrarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!novaSecretaria || !novoEmail) return;
    const res = await fetch("/api/admin/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretaria: novaSecretaria, email: novoEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setMostrarNovo(false);
      setNovaSecretaria("");
      setNovoEmail("");
      setMsg(`E-mail ${novoEmail} cadastrado.`);
      carregar();
    } else {
      setMsg(data.error ?? "Erro ao cadastrar.");
    }
  }

  async function excluirEmail(id: number, email: string) {
    if (!confirm(`Excluir o e-mail ${email}?`)) return;
    const res = await fetch(`/api/admin/emails/${id}`, { method: "DELETE" });
    if (res.ok) {
      carregar();
      setMsg(`E-mail ${email} excluído.`);
    } else {
      setMsg("Erro ao excluir.");
    }
  }

  function exportarCsv() {
    const linhas = [
      ["Secretaria", "E-mail", "Setor", "Responsável", "Cargo/Função", "Situação", "Observações", "Atualizado em"],
      ...emails.map((e) => [
        e.secretaria,
        e.email,
        e.setor ?? "",
        e.responsavel ?? "",
        e.cargo ?? "",
        situacaoInfo(e.situacao).label,
        e.observacao ?? "",
        e.atualizado_em ? new Date(e.atualizado_em).toLocaleString("pt-BR") : "",
      ]),
    ];
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-emails.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Relatório por Secretaria / Setor / E-mail</h2>
        <div className="flex gap-2">
          <button
            onClick={exportarCsv}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setMostrarNovo((v) => !v)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Cadastrar e-mail
          </button>
          <button
            onClick={sair}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total de e-mails</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{resumo.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Em uso</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{resumo.utilizadas}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Pendentes de preenchimento</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{resumo.pendentes}</p>
        </div>
      </div>

      {mostrarNovo && (
        <form onSubmit={cadastrarEmail} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={novaSecretaria}
              onChange={(e) => setNovaSecretaria(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Secretaria…</option>
              {secretarias.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              required
              placeholder="novo.email@juina.mt.gov.br"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Cadastrar
            </button>
          </div>
        </form>
      )}

      {msg && <p className="text-sm text-zinc-600">{msg}</p>}

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4">
        <select
          value={fSecretaria}
          onChange={(e) => { setFSecretaria(e.target.value); setCarregando(true); }}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todas as secretarias</option>
          {secretarias.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          value={fSetor}
          onChange={(e) => { setFSetor(e.target.value); setCarregando(true); }}
          placeholder="Filtrar setor…"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={fSituacao}
          onChange={(e) => { setFSituacao(e.target.value); setCarregando(true); }}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Todas as situações</option>
          {situacoes.map((s) => (
            <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
          ))}
        </select>
        <button
          onClick={() => { setFSecretaria(""); setFSetor(""); setFSituacao(""); setCarregando(true); }}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          Limpar filtros
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Secretaria</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Cargo/Função</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Observações</th>
              <th className="px-4 py-3">Atualizado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">Carregando…</td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">Nenhum e-mail encontrado.</td>
              </tr>
            ) : (
              emails.map((e) => {
                const s = situacaoInfo(e.situacao);
                return (
                  <tr key={e.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-800">{e.secretaria}</td>
                    <td className="px-4 py-3 text-zinc-600">{e.email}</td>
                    <td className="px-4 py-3">{e.setor || "—"}</td>
                    <td className="px-4 py-3">{e.responsavel || "—"}</td>
                    <td className="px-4 py-3">{e.cargo || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${s.cor}`}>
                        {s.emoji} {s.label}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-zinc-500" title={e.observacao ?? ""}>
                      {e.observacao || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {e.atualizado_em ? new Date(e.atualizado_em).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => excluirEmail(e.id, e.email)}
                        title="Excluir"
                        className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
        ← Voltar ao formulário
      </Link>
    </div>
  );
}