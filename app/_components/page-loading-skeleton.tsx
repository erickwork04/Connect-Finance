import Navbar from "@/app/_components/navbar";

type LoadingPage = "dashboard" | "transactions" | "banks" | "cards" | "installments" | "goals" | "commitments";

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-lg bg-white/[0.07] motion-safe:animate-pulse motion-reduce:animate-none ${className}`} />;
}

export default function PageLoadingSkeleton({ page, label }: { page: LoadingPage; label: string }) {
  return <>
    <Navbar />
    <main className="app-shell-content mx-auto w-full max-w-[1680px] min-w-0 space-y-5 px-4 py-5 sm:px-6 sm:py-6 xl:px-8" aria-busy="true" aria-label={`Carregando ${label}`}>
      {page === "dashboard" ? <>
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          <Skeleton className="h-36 lg:col-span-3" /><Skeleton className="h-36 lg:col-span-3" /><Skeleton className="h-36 sm:col-span-2 lg:col-span-6" />
        </section>
        <section className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-5" aria-hidden="true">
          <div className="space-y-5"><Skeleton className="h-44" /><Skeleton className="h-80" /><Skeleton className="h-64" /></div>
          <div className="space-y-5"><Skeleton className="h-64" /><Skeleton className="h-56" /><Skeleton className="h-64" /></div>
        </section>
      </> : <>
        <div className="flex items-center justify-between gap-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-11 w-36" /></div>
        {page === "transactions" || page === "commitments" ? <Skeleton className="h-14 w-full" /> : null}
        {page === "transactions" ? <><Skeleton className="h-20 w-full" /><div className="space-y-2">{[0, 1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-16 w-full" />)}</div></> : null}
        {page === "commitments" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((card) => <Skeleton key={card} className="h-72" />)}</div> : null}
        {page === "banks" || page === "cards" ? <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((card) => <Skeleton key={card} className="h-64" />)}</div>
        </> : null}
        {page === "installments" ? <><div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((card) => <Skeleton key={card} className="h-64" />)}</div></> : null}
        {page === "goals" ? <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-60" /><Skeleton className="h-60" /></div> : null}
      </>}
    </main>
  </>;
}
