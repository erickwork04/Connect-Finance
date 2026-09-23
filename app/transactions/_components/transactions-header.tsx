import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function TransactionsHeader({ month, view }: { month: string; view: "transactions" | "commitments" }) {
  return <div className="min-w-0 space-y-4">
    <header className="relative flex min-w-0 items-center justify-between gap-5 overflow-hidden rounded-xl border border-emerald-500/30 bg-[#111915] px-5 py-5 sm:px-6 sm:py-6 lg:py-5" style={{ backgroundImage: "radial-gradient(ellipse at bottom left, rgba(20, 136, 67, 0.25), transparent 48%), radial-gradient(ellipse at top right, rgba(22, 163, 74, 0.18), transparent 40%)" }}>
      <div className="relative min-w-0"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Transações</h1><p className="mt-2 max-w-[620px] text-sm leading-5 text-muted-foreground sm:text-base">Acompanhe, filtre e gerencie todas as suas movimentações financeiras.</p></div>
      <div className="relative hidden shrink-0 items-center gap-3 rounded-xl border border-emerald-500/30 bg-black/20 p-3 lg:flex"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><TrendingUp aria-hidden="true" className="h-6 w-6" /></span><p className="max-w-[132px] text-xs leading-5 text-foreground/90">Mais controle para um futuro maior.</p></div>
    </header>
    <nav aria-label="Áreas de transações" className="flex min-w-0 gap-1 border-b border-border">
      {([
        { key: "transactions", label: "Transações", href: `/transactions?month=${month}` },
        { key: "commitments", label: "Compromissos", href: `/transactions?month=${month}&view=commitments` },
      ] as const).map((tab) => <Link key={tab.key} href={tab.href} aria-current={view === tab.key ? "page" : undefined} className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${view === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab.label}</Link>)}
    </nav>
  </div>;
}
