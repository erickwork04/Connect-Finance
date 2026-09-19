# 10 — Componentes compartilhados

**Objetivo:** reduzir duplicação real sem criar uma camada genérica excessiva.

**Situação atual:** Navbar, PageHeader, SummaryCard, MoneyInput, DatePicker e tabela já estão componentizados; Metas/Cartões compartilham um estado de indisponibilidade.

**Problemas encontrados:** cinco abas não cabiam confortavelmente no breakpoint anterior da navbar; estados vazios de Metas/Cartões seriam duplicados; cabeçalhos repetidos dificultavam consistência.

**Alterações realizadas:** `PageHeader` agora é reutilizado também em Metas/Cartões; `FeatureEmptyState` atende ambas. `NAV_ITEMS`, `isNavActive` e `getNavHref` incluem as novas rotas. A navbar ajusta logo/espaçamento e usa menu vertical no tablet; `TransactionRow` continua explicitando a fronteira servidor/cliente.

**Direção visual:** conservar Mulish, fundo quase preto, superfície zinc escura, borda discreta e verde existente (`#55B02E`) apenas para ações e estados. Os cards de dados usam números tabulares e hierarquia financeira; estados sem backend não mostram valores fictícios.

**Arquivos/componentes envolvidos:** `app/_components/page-header.tsx`, `feature-empty-state.tsx`, `navbar.tsx`, `app/_lib/navigation.ts`, `app/transactions/_lib/transaction-row.ts`, páginas consumidoras.

**Critérios de aceite:** indicação ativa verde em desktop/mobile; menu mobile interativo; sem overflow em 320/375/768/1280 px; cabeçalhos/estado indisponível reutilizados sem alterar identidade visual; DTOs sem `any`.

**Status:** CONCLUÍDO nesta extração seletiva; futuros componentes surgirão conforme necessidade real.
