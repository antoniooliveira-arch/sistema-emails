import AdminPanel from "@/components/AdminPanel";
import LoginForm from "@/components/LoginForm";
import { requireAdmin } from "@/lib/auth";

export const metadata = {
  title: "Painel Admin | Levantamento de E-mails",
};

export default async function AdminPage() {
  const autorizado = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Painel Administrativo</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Relatório por secretaria, setor e situação dos e-mails institucionais.
        </p>
      </header>
      {autorizado ? <AdminPanel /> : <LoginForm />}
    </main>
  );
}