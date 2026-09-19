import Link from "next/link";

import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-zinc-900">
        <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
            Gestão financeira inteligente
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Organize sua vida financeira com o{" "}
            <span className="text-green-500">Connect Finance</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Controle receitas, despesas, categorias e movimentações em um só
            lugar. Acompanhe seu orçamento e utilize inteligência artificial
            para obter análises e insights sobre suas finanças.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
            >
              <button className="rounded-lg bg-green-500 px-6 py-3 font-medium text-black transition hover:bg-green-400">
                Começar agora
              </button>
            </SignUpButton>

            <Link href="/login" className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-900">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">
            Tudo que você precisa para cuidar melhor do seu dinheiro
          </h2>

          <p className="mt-4 text-zinc-400">
            Tenha uma visão clara das suas finanças e tome decisões com mais
            segurança.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-4 text-2xl">📊</div>

            <h3 className="text-lg font-semibold">
              Dashboard financeiro
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Visualize saldo, receitas, despesas, categorias e movimentações
              de forma simples e organizada.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-4 text-2xl">🤖</div>

            <h3 className="text-lg font-semibold">
              Relatórios com IA
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Utilize inteligência artificial para receber análises e insights
              personalizados sobre sua situação financeira.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-4 text-2xl">🔒</div>

            <h3 className="text-lg font-semibold">
              Segurança e privacidade
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Seus dados são tratados com foco em segurança, privacidade e
              controle de acesso.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-medium text-green-500">
                Simples e direto
              </span>

              <h2 className="mt-3 text-3xl font-bold">
                Entenda para onde seu dinheiro está indo
              </h2>

              <p className="mt-5 leading-7 text-zinc-400">
                Registre suas movimentações, acompanhe seus gastos por categoria
                e compare receitas e despesas ao longo do mês.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-sm text-zinc-500">
                    Saldo atual
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    R$ 2.700,00
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-sm text-zinc-500">
                      Receitas
                    </p>

                    <p className="mt-2 font-semibold text-green-500">
                      R$ 8.150,00
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                    <p className="text-sm text-zinc-500">
                      Despesas
                    </p>

                    <p className="mt-2 font-semibold text-red-500">
                      R$ 2.950,00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          Comece a organizar suas finanças hoje
        </h2>

        <p className="mt-4 text-zinc-400">
          Crie sua conta e tenha uma visão mais clara da sua vida financeira.
        </p>

        <SignUpButton
          mode="modal"
          forceRedirectUrl="/dashboard"
        >
          <button className="mt-8 inline-flex rounded-lg bg-green-500 px-6 py-3 font-medium text-black transition hover:bg-green-400">
            Criar minha conta
          </button>
        </SignUpButton>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 Connect Finance. Todos os direitos reservados.
          </p>

          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="transition hover:text-green-500"
            >
              Política de Privacidade
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-green-500"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
