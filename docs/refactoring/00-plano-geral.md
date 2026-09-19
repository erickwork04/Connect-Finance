# 00 — Plano geral

**Objetivo:** estabilizar regressões após Next 15/Clerk 6 e preparar a evolução visual sem redesenho, banco ou deploy.

**Situação atual:** Dashboard, Transações e Assinatura existem; Metas e Cartões agora têm rotas protegidas e camada visual, mas não têm domínio/persistência. O código local prevalece sobre registros históricos da Fase 0.

**Problemas encontrados:** login de entrada dependia de modal; edição não hidratava o campo monetário; Dashboard usava `MM`, URL da landing e navbar inconsistente; testes autenticados exigem sessão.

**Alterações realizadas:** entrada local `/login`, DTO de transação, campos controlados, mês `YYYY-MM`, navegação unificada, `PageHeader` e testes unitários. Na evolução visual seguinte, foram implementados componentes de Metas/Cartões sem dados fictícios no fluxo real e a UI de Assinatura com estados gratuito, Premium, loading e erro. As dependências de backend continuam documentadas.

**Arquivos envolvidos:** `app/(home)/page.tsx`, `app/login/page.tsx`, `app/dashboard/`, `app/transactions/`, `app/goals/`, `app/cards/`, `app/subscription/`, `app/_components/`, `app/_lib/`, estes documentos.

**Critérios de aceite:** lint, build, testes e Prisma validate locais passam; login visual abre; navegação, mês e edição autenticados são confirmados manualmente antes de publicação. Nenhum dado, migration, segredo ou ambiente remoto alterado.

**Status:** CONCLUÍDO quanto ao plano; fluxos em validação conforme documentos 01–04 e 07–09.
