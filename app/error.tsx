"use client";

import { Button } from "@/app/_components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-5 text-center" aria-labelledby="load-error-title">
    <div role="alert" aria-live="assertive" className="space-y-2">
      <h1 id="load-error-title" className="text-2xl font-bold">Não foi possível carregar esta página</h1>
      <p className="text-sm leading-6 text-muted-foreground">Sua conexão pode ter falhado ou o serviço pode estar temporariamente indisponível. Seus dados permanecem no formulário; tente carregar novamente.</p>
    </div>
    <Button type="button" onClick={reset} className="min-h-11">Tentar carregar novamente</Button>
  </main>;
}
