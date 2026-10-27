function Placeholder({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-lg bg-white/[0.07] motion-safe:animate-pulse motion-reduce:animate-none ${className}`} />;
}

export default function Loading() {
  return <main className="min-h-screen bg-[#090c0b] p-5 text-white sm:p-8" aria-busy="true" aria-label="Carregando Connect Finance">
    <header className="mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-white/[0.07]">
      <Placeholder className="h-8 w-40" />
      <Placeholder className="h-10 w-36" />
    </header>
    <section className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-10 py-12 lg:grid-cols-2" aria-hidden="true">
      <div className="space-y-5"><Placeholder className="h-8 w-48" /><Placeholder className="h-16 w-full max-w-xl" /><Placeholder className="h-16 w-4/5 max-w-xl" /><Placeholder className="h-20 w-full max-w-xl" /><Placeholder className="h-12 w-48" /></div>
      <Placeholder className="h-80 w-full rounded-3xl" />
    </section>
  </main>;
}
