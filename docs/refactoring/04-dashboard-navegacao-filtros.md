# 04 — Dashboard, navegação e filtros

**Objetivo:** fixar mês/ano selecionado e abas ativas em navegação e atualização.

**Situação atual:** `searchParams` da página é assíncrono (Next 15); dados e relatório IA recebem o mês canônico `YYYY-MM`. O seletor mantém valor controlado; navbar preserva `month` válido nos links principais.

**Problemas encontrados:** seletor enviava para `/`, usava `defaultValue`; backend filtrava o ano atual, mesmo para URL histórica; navbar apontava Dashboard para `/`. `Outubro` estava grafado incorretamente.

**Alterações realizadas:** canonicalização de `MM` legado e entrada inválida, URL `/dashboard?month=YYYY-MM`, filtro UTC `[primeiro dia, primeiro dia seguinte)`, `router.push` preservando outros parâmetros, `aria-current` e helper compartilhado para rotas principais e filhas. Os atalhos “Ver mais” e “Ver Premium” também carregam o mês selecionado.

**Arquivos envolvidos:** `app/dashboard/page.tsx`, `_componets/time-select.tsx`, `_componets/_actions/generat-ai-report/`, `app/_data/get-dashboard/index.ts`, `app/_components/navbar.tsx`, `app/_lib/month-range.ts`, `app/_lib/navigation.ts` e testes.

**Critérios de aceite:** mês visível corresponde à URL; reload e ida/volta entre abas mantêm o período; filtros incluem todo o último dia; relatório IA usa o mesmo ano/mês; aba correta fica ativa no desktop/mobile. Navegação autenticada exige verificação manual.

**Status:** EM ANDAMENTO — lógica testada localmente; visual autenticado pendente.
