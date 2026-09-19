"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";

export default function SubscriptionError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center p-4 sm:p-6">
      <Card className="w-full border-border bg-zinc-950/80">
        <CardContent className="space-y-4 p-6 sm:p-10">
          <AlertCircle aria-hidden="true" className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold sm:text-2xl">Não foi possível carregar sua assinatura</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Não foi possível consultar o plano agora. Tente novamente ou volte ao Dashboard; nenhum dado da assinatura foi alterado.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={reset} className="h-11">Tentar novamente</Button>
            <Button variant="outline" asChild className="h-11"><Link href="/dashboard">Voltar ao Dashboard</Link></Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
