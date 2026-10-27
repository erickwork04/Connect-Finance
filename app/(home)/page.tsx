import Image from "next/image";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CreditCard,
  LockKeyhole,
  Sparkles,
  WalletCards,
} from "lucide-react";

const chartBars = [
  { label: "Seg", height: "34%" },
  { label: "Ter", height: "48%" },
  { label: "Qua", height: "39%" },
  { label: "Qui", height: "66%" },
  { label: "Sex", height: "52%" },
  { label: "Sáb", height: "82%" },
  { label: "Dom", height: "61%" },
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) redirect("/dashboard");

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#090c0b] text-white">
      <header className="relative z-10 border-b border-white/[0.07]">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"
        >
          <Link
            href="/"
            aria-label="Connect Finance — início"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]"
          >
            <Image
              src="/logo.png"
              alt="Connect Finance"
              width={2172}
              height={724}
              priority
              className="h-auto w-[145px] sm:w-[170px]"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#recursos" className="rounded-sm text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]">
              Recursos
            </Link>
            <Link href="#como-funciona" className="rounded-sm text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]">
              Como funciona
            </Link>
            <Link href="/login" className="rounded-sm text-sm text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]">
              Entrar
            </Link>
          </div>

          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <button className="min-h-10 rounded-lg bg-[#55b02e] px-4 text-sm font-bold text-[#071006] transition hover:bg-[#68c43c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#090c0b]">
              Criar conta grátis
            </button>
          </SignUpButton>
        </nav>
      </header>

      <section className="landing-hero relative isolate">
        <div aria-hidden="true" className="landing-orbit landing-orbit-one" />
        <div aria-hidden="true" className="landing-orbit landing-orbit-two" />

        <div className="landing-reveal relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#55b02e]/25 bg-[#55b02e]/[0.08] px-3.5 py-2 text-sm text-[#a8e78c]">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55b02e] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#55b02e]" />
              </span>
              Mais clareza para o seu dia a dia
            </div>

            <h1 className="max-w-[680px] text-[2.8rem] font-semibold leading-[1.07] tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem]">
              Seu dinheiro em ordem.
              <span className="mt-1 block text-[#70ca49]">Sua cabeça também.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Receitas, gastos, cartões e parcelas em uma visão simples do mês.
              Entenda o que acontece com o seu dinheiro e decida com mais tranquilidade.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#55b02e] px-6 font-bold text-[#071006] shadow-[0_10px_35px_-15px_rgba(85,176,46,0.8)] transition hover:-translate-y-0.5 hover:bg-[#68c43c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#090c0b]">
                  Começar agora
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </SignUpButton>
              <Link
                href="#recursos"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]"
              >
                Conhecer a plataforma
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><Check aria-hidden="true" className="h-4 w-4 text-[#70ca49]" /> Comece gratuitamente</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole aria-hidden="true" className="h-4 w-4 text-[#70ca49]" /> Seus dados, sob seu controle</span>
            </div>
          </div>

          <div className="landing-float relative mx-auto w-full max-w-[590px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-[#55b02e]/[0.08] blur-3xl" />
            <div className="relative rounded-[1.65rem] border border-white/[0.12] bg-[#111715]/95 p-4 shadow-[0_30px_100px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#55b02e]/15 text-[#80d75a]">
                    <WalletCards aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Visão do seu mês</p>
                    <p className="mt-0.5 text-xs text-slate-400">Um exemplo do Connect Finance</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-xs text-slate-300">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-[#70ca49]" />
                  Este mês
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-5">
                <div className="rounded-xl border border-white/[0.07] bg-[#171f1c] p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><ArrowDownRight aria-hidden="true" className="h-4 w-4 text-[#70ca49]" /> Entradas</div>
                  <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">R$ 8.450,00</p>
                  <p className="mt-1 text-xs text-[#70ca49]">O que chegou</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#171f1c] p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><ArrowUpRight aria-hidden="true" className="h-4 w-4 text-rose-400" /> Saídas</div>
                  <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">R$ 5.510,00</p>
                  <p className="mt-1 text-xs text-slate-400">Gastos e compromissos</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#0d1210] p-4 sm:p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Livre no mês</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">R$ 2.940<span className="text-xl text-slate-300">,00</span></p>
                  </div>
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#55b02e]/10 px-2.5 py-1 text-xs font-medium text-[#8cdb6c]"><ChartNoAxesCombined aria-hidden="true" className="h-3.5 w-3.5" /> Visão geral</span>
                </div>
                <div className="mt-5 flex h-24 items-end gap-2 border-b border-white/[0.08] pb-2 sm:h-28 sm:gap-3" aria-label="Gráfico ilustrativo de movimentações">
                  {chartBars.map((bar, index) => (
                    <div key={bar.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div
                        className={`w-full origin-bottom rounded-t-md ${index === 5 ? "bg-[#69c643]" : "bg-[#55b02e]/35"}`}
                        style={{ height: bar.height }}
                      />
                      <span className="text-center text-[10px] text-slate-500">{bar.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Entradas e saídas em um só lugar</span>
                  <span className="text-[#8cdb6c]">Exemplo ilustrativo</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#55b02e]/15 bg-[#55b02e]/[0.07] px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#55b02e]/15 text-[#80d75a]"><CreditCard aria-hidden="true" className="h-4 w-4" /></span>
                <p className="min-w-0 flex-1 text-sm text-slate-200">Parcelas e faturas visíveis no planejamento</p>
                <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[#70ca49]" />
              </div>
            </div>

            <div className="landing-float-note absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-xl border border-white/[0.12] bg-[#19211d] px-4 py-3 shadow-xl sm:flex lg:-left-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#55b02e]/15 text-[#80d75a]"><Sparkles aria-hidden="true" className="h-4 w-4" /></span>
              <span><span className="block text-xs text-slate-400">Seu próximo passo</span><span className="mt-0.5 block text-sm font-medium">Decidir com mais clareza</span></span>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-10 border-y border-white/[0.07] bg-[#0e1311]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:py-24 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="max-w-md">
            <p className="text-sm font-semibold text-[#80d75a]">Uma rotina financeira mais simples</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              Tudo conversa com o seu mês.
            </h2>
            <p className="mt-5 leading-7 text-slate-400">
              Em vez de espalhar informações, acompanhe as partes importantes da sua vida financeira em uma plataforma só.
            </p>
          </div>

          <div className="divide-y divide-white/[0.08]">
            <article className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[52px_1fr] sm:gap-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#55b02e]/10 text-[#80d75a]"><WalletCards aria-hidden="true" className="h-5 w-5" /></span>
              <div><h3 className="text-lg font-semibold">Acompanhe o que entra e sai</h3><p className="mt-2 max-w-xl leading-6 text-slate-400">Registre suas movimentações e entenda como receitas, despesas e categorias mudam ao longo do mês.</p></div>
            </article>
            <article className="grid gap-4 py-6 sm:grid-cols-[52px_1fr] sm:gap-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#55b02e]/10 text-[#80d75a]"><CreditCard aria-hidden="true" className="h-5 w-5" /></span>
              <div><h3 className="text-lg font-semibold">Planeje cartões e parcelas</h3><p className="mt-2 max-w-xl leading-6 text-slate-400">Veja faturas e compras parceladas junto do restante do orçamento, para saber o que já está comprometido.</p></div>
            </article>
            <article className="grid gap-4 py-6 last:pb-0 sm:grid-cols-[52px_1fr] sm:gap-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#55b02e]/10 text-[#80d75a]"><ChartNoAxesCombined aria-hidden="true" className="h-5 w-5" /></span>
              <div><h3 className="text-lg font-semibold">Encontre caminhos para melhorar</h3><p className="mt-2 max-w-xl leading-6 text-slate-400">Use relatórios e insights para reconhecer padrões e escolher com mais segurança os próximos passos.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold text-[#80d75a]">Do registro à decisão</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Um jeito mais leve de cuidar do dinheiro.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/[0.08] bg-[#111715] p-6 sm:p-7">
            <span className="text-sm font-semibold text-[#80d75a]">01</span>
            <h3 className="mt-7 text-xl font-semibold">Registre</h3>
            <p className="mt-3 leading-6 text-slate-400">Anote receitas e despesas ou importe seus arquivos financeiros.</p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-[#111715] p-6 sm:p-7">
            <span className="text-sm font-semibold text-[#80d75a]">02</span>
            <h3 className="mt-7 text-xl font-semibold">Organize</h3>
            <p className="mt-3 leading-6 text-slate-400">Separe por categorias, contas, cartões e compromissos futuros.</p>
          </article>
          <article className="rounded-2xl border border-[#55b02e]/25 bg-[linear-gradient(145deg,rgba(85,176,46,0.12),rgba(17,23,21,0.94)_65%)] p-6 sm:p-7">
            <span className="text-sm font-semibold text-[#80d75a]">03</span>
            <h3 className="mt-7 text-xl font-semibold">Decida</h3>
            <p className="mt-3 leading-6 text-slate-300">Consulte o panorama do mês e escolha seu próximo passo com confiança.</p>
          </article>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 md:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-[#55b02e]/20 bg-[#101813] px-6 py-12 sm:px-10 md:py-16 lg:px-14">
          <div aria-hidden="true" className="absolute -right-20 -top-36 h-96 w-96 rounded-full bg-[#55b02e]/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Comece a dar mais espaço aos seus planos.</h2>
              <p className="mt-4 leading-7 text-slate-300">Crie sua conta e veja suas finanças com mais clareza, mês a mês.</p>
            </div>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#55b02e] px-6 font-bold text-[#071006] transition hover:-translate-y-0.5 hover:bg-[#68c43c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101813]">
                Criar minha conta grátis
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Connect Finance. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="rounded-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]">Política de Privacidade</Link>
            <Link href="/terms" className="rounded-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b02e]">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
