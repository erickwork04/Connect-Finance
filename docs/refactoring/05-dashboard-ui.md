# 05 — Dashboard UI

**Objetivo:** evoluir a interface sem perder filtros, relatórios e dados reais.

**Situação atual:** navbar, título, mês, Relatório IA, saldo, três cards, gráfico, categorias e últimas transações já estão separados em componentes e têm layout responsivo básico.

**Problemas encontrados:** validação visual autenticada e estados vazios/responsivos ainda não foram concluídos; havia uma prop `month` não consumida em `SummaryCards`, removida nesta etapa.

**Alterações realizadas ou planejadas:** nesta etapa apenas `PageHeader` compartilhado e filtro estável; depois, revisar hierarquia, estados vazios, acessibilidade e dimensões móveis com dados reais, mantendo fundo escuro e verde.

**Arquivos/componentes envolvidos:** `app/dashboard/page.tsx`, `app/dashboard/_componets/*`, `app/_components/page-header.tsx`.

**Critérios de aceite:** composição solicitada em desktop/mobile, sem dados falsos, filtro/IA funcionais, estados vazios claros e sem regressão visual.

**Status:** PENDENTE — evolução visual posterior ao teste autenticado.
