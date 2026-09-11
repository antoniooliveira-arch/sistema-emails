import FormularioEmail from "@/components/FormularioEmail";

export const metadata = {
  title: "Levantamento de E-mails Institucionais",
  description: "Formulário de levantamento dos e-mails institucionais do município.",
};

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">
          Levantamento dos E-mails Institucionais
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Selecione a secretaria e o e-mail para informar quem utiliza e a situação atual.
        </p>
      </header>
      <FormularioEmail />
      <footer className="text-center text-xs text-zinc-400">
        <a href="/admin" className="hover:text-zinc-600">
          Painel administrativo
        </a>
      </footer>
    </main>
  );
}