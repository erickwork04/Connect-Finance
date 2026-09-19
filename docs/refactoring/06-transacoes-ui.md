# 06 — Transações UI

**Objetivo:** preparar a tabela e o formulário para melhoria visual incremental.

**Situação atual:** título/ação, colunas Nome, Tipo, Categoria, Método, Data, Valor e Ações, badges de importação e layout com rolagem horizontal já existem.

**Problemas encontrados:** estado vazio da tabela é genérico; tabela larga requer revisão em mobile; edição depende de validação autenticada após correção de valor/data.

**Alterações realizadas ou planejadas:** `PageHeader` compartilhado e DTO tipado; depois, criar `EmptyState`/visualização compacta somente se uso real justificar, sem mudar importação ou exclusão.

**Arquivos/componentes envolvidos:** `app/transactions/page.tsx`, `_columns/index.tsx`, `_components/*`, `app/_components/ui/data-table.tsx`, `app/_components/page-header.tsx`.

**Critérios de aceite:** tabela acessível e legível no celular, origens distinguíveis, ações operacionais, valor/data corretos e nenhuma transação inventada.

**Status:** PENDENTE — evolução visual futura; bug de edição tratado no documento 03.
