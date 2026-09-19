# 03 — Edição de transações

**Objetivo:** carregar e preservar valor e data de registros manuais e importados.

**Situação atual:** valores Prisma são `Decimal(10,2)` em reais; não há conversão para centavos nesta ação. A tabela serializava objetos genericamente e tratava os registros no cliente como se ainda fossem `Transaction` Prisma.

**Problemas encontrados:** `MoneyInput` não recebia `field.value`; `date` serializada era string, não `Date`; tipos mascaravam a diferença entre objeto Prisma e linha enviada ao cliente. O date-picker tinha botão dentro do formulário sem `type="button"`.

**Alterações realizadas:** DTO explícito (`amount` decimal string, `date` ISO), transformação para formulário (`amount` number em reais, `date` Date), input monetário e selects controlados, reset de dados ao abrir edição e botão de calendário não-submissor. `source` permanece para badges OFX/CSV/fatura.

**Arquivos envolvidos:** `app/transactions/page.tsx`, `_lib/transaction-row.ts`, `_columns/index.tsx`, `_components/edit-transaction-button.tsx`, `_components/type-badge.tsx`, `app/_components/upsert-transaction-dialog.tsx`, `app/_components/ui/date-picker.tsx` e teste do DTO.

**Critérios de aceite:** editar registros de cada origem mostra valor inicial em R$; salvar sem modificá-lo mantém o valor e a data; schema Zod aceita dados; teste unitário cobre origens e conversão. Salvar em banco exige teste manual autenticado, não executado nesta etapa.

**Status:** EM ANDAMENTO — cobertura local do DTO; fluxo autenticado pendente.
