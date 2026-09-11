"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      if (!res.ok) {
        setErro("Senha incorreta.");
        setEntrando(false);
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
      setEntrando(false);
    }
  }

  return (
    <form
      onSubmit={entrar}
      className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-center text-lg font-semibold text-zinc-900">Painel Administrativo</h2>
      <p className="mt-1 text-center text-sm text-zinc-500">Digite a senha de acesso.</p>
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        autoFocus
        className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={entrando}
        className="mt-4 w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}