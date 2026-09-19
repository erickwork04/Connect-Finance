# 07 — Metas UI

**Objetivo:** disponibilizar a camada visual de metas sem inventar dados ou persistência.

**Situação atual:** `/goals` é uma rota privada com título, botão de adicionar meta e estado explícito de indisponibilidade. `GoalCard` aceita nome, valor atual, objetivo, progresso, prazo e status por props tipadas. Não há modelo, consulta, cadastro ou registro real de metas.

**Problema:** criar cards preenchidos a partir de transações ou dados fictícios faria a tela parecer operacional sem fonte confiável. Também não há regra aprovada para calcular saldo, prazo e status.

**Decisão e alterações:** separar `GoalsPage` (autenticação) de `GoalsScreen` (apresentação); usar `null` para fonte ainda indisponível e array para integração futura. O botão de cadastro permanece desabilitado com explicação visível. `GoalCard` é apenas de exibição e limita o progresso visual a 0–100%, sem alterar valor financeiro. `FeatureEmptyState` é reutilizado.

**Arquivos/componentes:** `app/goals/page.tsx`, `app/goals/_components/goals-screen.tsx`, `goal-card.tsx`, `app/_components/feature-empty-state.tsx`, `app/_lib/navigation.ts`, `app/_components/navbar.tsx`.

**Testes e critérios de aceite:** rota sem sessão redirecionou a `/login` (307); cards e estado indisponível foram inspecionados em desktop (1280/1440 px), tablet (768 px) e mobile (375/320 px), sem overflow horizontal; menu mobile e aba ativa foram verificados. A integração futura deve usar dados autorizados por usuário, cálculo confiável de progresso/status e ação de cadastro persistente antes de habilitar o botão.

**Pendências e riscos:** backend, persistência, regras de negócio, edição/exclusão e teste com sessão real. A validação visual usou uma prévia local temporária removida do código final; nenhum exemplo aparece no fluxo real.

**Status:** EM ANDAMENTO — camada visual concluída; funcionalidade de metas depende de backend autorizado.
