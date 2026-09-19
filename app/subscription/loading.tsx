import { Card, CardContent } from "@/app/_components/ui/card";

export default function SubscriptionLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6" aria-busy="true" aria-label="Carregando assinatura">
      <div className="h-8 w-44 rounded bg-muted motion-safe:animate-pulse" />
      <div className="h-5 w-full max-w-md rounded bg-muted motion-safe:animate-pulse" />
      <Card className="border-border bg-zinc-950/70"><CardContent className="space-y-5 p-5 sm:p-7">
        <div className="h-5 w-32 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-10 w-48 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-5 w-full max-w-sm rounded bg-muted motion-safe:animate-pulse" />
      </CardContent></Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((item) => <Card key={item} className="border-border bg-zinc-950/70"><CardContent className="space-y-5 p-5 sm:p-6">
          <div className="h-7 w-36 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-5 w-full rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-5 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
        </CardContent></Card>)}
      </div>
    </main>
  );
}
