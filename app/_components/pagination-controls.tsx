"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { updatePaginationQuery } from "@/app/_lib/pagination";

export default function PaginationControls({ page, pageSize, total, pageSizeOptions = [10, 25, 50, 100], noun = "itens" }: {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: readonly number[];
  noun?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const navigate = (updates: Record<string, string | null>) => {
    const query = updatePaginationQuery(searchParams.toString(), updates);
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  return <nav aria-label={`Paginação de ${noun}`} aria-busy={isPending} className="flex flex-col gap-3 rounded-xl border border-border bg-[#141816] p-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <label className="flex items-center gap-2">Itens por página
        <select aria-label={`Itens por página de ${noun}`} value={pageSize} disabled={isPending} onChange={(event) => navigate({ page: "1", pageSize: event.target.value })} className="min-h-10 rounded-lg border border-border bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <span aria-live="polite">{first}–{last} de {total.toLocaleString("pt-BR")} {noun}</span>
      {isPending ? <span role="status">Carregando página...</span> : null}
    </div>
    <div className="flex items-center justify-end gap-2">
      <button type="button" aria-label={`Página anterior de ${noun}`} disabled={page <= 1 || isPending} onClick={() => navigate({ page: String(page - 1) })} className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
      <span aria-current="page" className="min-w-20 text-center text-sm tabular-nums text-muted-foreground">Página {page} de {totalPages}</span>
      <button type="button" aria-label={`Próxima página de ${noun}`} disabled={page >= totalPages || isPending} onClick={() => navigate({ page: String(page + 1) })} className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50">Próxima</button>
    </div>
  </nav>;
}
