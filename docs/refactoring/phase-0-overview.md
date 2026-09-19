# Phase 0 - Critical Containment

> Atualização local: a estratégia mudou após o revert do GitHub informado pelo usuário. A fonte principal agora é o código em `C:\SAAS\Connect-Finance`, branch `teste-webhook-local`. Registros abaixo sobre `origin/main`, publicação e Vercel descrevem o contexto histórico das Etapas 1–3, não autorizam operações remotas nem representam o estado remoto atual. A validação real do Mercado Pago permanece **PENDENTE — validação com credenciais/ambiente real do Mercado Pago**.

## Objetivo

Executar a contenção crítica do Connect-Finance em etapas pequenas, validadas e independentes. Este arquivo é o registro de progresso para retomada.

## Problema encontrado

O `origin` local apontava para `erickwork04/Finance-Ai.git`, enquanto o repositório indicado para o trabalho era `erickwork04/Connect-Finance.git`. A tentativa inicial no Codex foi bloqueada por permissão de escrita em `.git/config`. O usuário corrigiu manualmente fora do Codex, e a nova configuração foi validada.

Na Etapa 2, foi identificada uma dependência de segurança: o webhook Mercado Pago precisava validar `x-signature` antes de ser aberto no middleware Clerk. O usuário autorizou executar as Etapas 3 e 2 como unidade de segurança. A implementação e os testes locais foram concluídos. Depois, o usuário configurou o segredo no `.env` local; a presença da chave foi verificada sem ler o valor e a rota passou a rejeitar uma chamada sem assinatura com `401`. O usuário também confirmou que cadastrou a variável no ambiente Production da Vercel; o Codex não teve acesso ao painel para verificar isso diretamente. Um callback real permanece sem validação.

## Evidência

- Antes: `git remote -v` mostrava fetch e push em `https://github.com/erickwork04/Finance-Ai.git`.
- GitHub confirmou `clone_url` `https://github.com/erickwork04/Connect-Finance.git` e `main` no SHA `76b2c5267f8f7389b05b0f82cc43a4e6b5edbb79`, igual ao `HEAD` local.
- `git remote set-url origin https://github.com/erickwork04/Connect-Finance.git` retornou `could not lock config file .git/config: Permission denied`, mesmo após solicitação de escrita ao repositório, à pasta `.git` e aos arquivos `.git/config`/`.git/config.lock`.
- Depois da correção manual do usuário: `git remote -v` mostra `Connect-Finance.git` para fetch e push.
- Antes, `middleware.ts` protegia os dois webhooks; o handler Mercado Pago processava notificações sem assinatura. O Stripe já validava `stripe-signature`. Depois, somente as duas rotas exatas foram liberadas, e o Mercado Pago exige HMAC válido. Detalhes em `webhook-public-routes.md` e `mercado-pago-webhook-security.md`.

## Arquivos envolvidos

- `.git/config` (configuração local, não versionada; corrigida manualmente pelo usuário fora do Codex).
- `docs/refactoring/git-remote-fix.md` (registro detalhado da Etapa 1).
- `docs/refactoring/phase-0-overview.md` (este registro).
- `middleware.ts` e `app/api/webhooks/mercado-pago/route.ts` (alterados nas Etapas 2/3); `app/api/webhooks/stripe/route.ts` (analisado, não alterado).
- `app/api/webhooks/mercado-pago/verify-signature.ts` e `verify-signature.test.mjs` (novos), `.env.example` (nova chave sem valor).
- `docs/refactoring/webhook-public-routes.md` e `mercado-pago-webhook-security.md` (detalhes das Etapas 2/3).

## Alterações realizadas

- O usuário corrigiu o remote manualmente fora do Codex.
- O Codex não editou `.git/config`.
- Na Etapa 1, somente a documentação de acompanhamento foi criada/atualizada.
- Nas Etapas 2/3 autorizadas, foram liberadas duas rotas exatas no middleware; o webhook Mercado Pago agora verifica assinatura HMAC antes do processamento, rejeita entradas inconsistentes, reduz reprocessamento e não registra mais o corpo completo. `.env.example` documenta o segredo necessário sem valor real.
- Não houve commit, push, mudança de banco, migration, dependência ou segredo real.

## Decisões técnicas

- Não contornar a proteção de escrita de `.git/config` nem usar uma URL temporária somente por comando; o usuário fez a alteração persistente fora do ambiente Codex.
- Marcar a Etapa 1 como concluída somente após verificar novamente fetch e push.
- Não liberar o Mercado Pago sem assinatura verificada. Com autorização do usuário, antecipar a Etapa 3 como pré-requisito e validar as Etapas 2/3 juntas.
- Não iniciar a Etapa 4 nesta entrega; parar após revisar código, testes e documentação.

## Riscos

- O risco principal do `origin` incorreto foi mitigado pela correção validada.
- A conectividade e credenciais remotas não foram testadas, pois não houve fetch ou push.
- A documentação permanece não rastreada (`docs/`) até que seja adicionada em um commit futuro.
- **BLOCKER operacional:** o usuário confirmou `MERCADO_PAGO_WEBHOOK_SECRET` em Production na Vercel, mas o Codex não verificou o painel (login exigido; sem CLI Vercel ou vínculo `.vercel/project.json`). O código das Etapas 2/3 permanece sem commit/push, portanto ainda não está demonstrado em produção. Nenhum callback real foi testado.
- **HIGH (posterior):** não há deduplicação persistente de eventos e Stripe/Mercado Pago compartilham `subscriptionPlan`; replay, concorrência e múltiplas assinaturas exigem futura modelagem de billing. As guardas atuais evitam escritas repetidas simples e cancelamento de ID diferente.

## Validações executadas

- `git remote -v` antes da tentativa e após a correção manual; fetch e push agora apontam para `Connect-Finance.git`.
- `git status` confirmou somente `docs/` não rastreado; `git rev-parse HEAD` confirmou SHA inalterado.
- Consulta de metadados e commit `main` do repositório GitHub indicado.
- Tentativas de `git remote set-url` no Codex após permissões granulares falharam; a correção efetiva foi feita pelo usuário.
- Na Etapa 1, `git diff --stat` era vazio porque os documentos novos ainda eram não rastreados; foram revisados diretamente.
- Nas Etapas 2/3, `node --experimental-strip-types --test app/api/webhooks/mercado-pago/verify-signature.test.mjs` passou (3 testes); `tsc --noEmit --incremental false`, `npm run lint` e `npm run build` passaram. Não há scripts `typecheck` ou `test` no `package.json`.
- Teste HTTP sem sessão: Mercado Pago sem segredo → `503`, Stripe sem assinatura → `400`, dashboard → `307 /login`. Com segredo fictício no processo: notificação assinada de tipo não tratado → `200`, assinatura inválida → `401`. Nenhum callback real, API do provedor ou Clerk foi alterado no teste.
- Após a configuração manual do usuário, foi verificada somente a presença de valor não vazio em `.env` (sem exibir o valor); `git check-ignore -v` confirmou que `.env` e `.env.local` são ignorados. Em `next start` local, `POST` sem assinatura retornou `401`, e `/dashboard` continuou retornando `307 /login`.
- A tentativa de leitura do painel Vercel chegou à tela de login; nenhum login foi automatizado. Não há `vercel` CLI nem vínculo de projeto local. A variável e o deployment na Vercel não foram verificados.
- O usuário confirmou por mensagem que adicionou a variável no ambiente Production da Vercel. Esta é uma confirmação do usuário, não uma verificação técnica do valor ou do deployment.
- `git diff --check`, `git status` e revisão do diff executados; os arquivos novos permanecem não rastreados e não aparecem em `git diff --stat` até serem adicionados.

## Resultado

- [x] Git remote — correção manual do usuário validada no Codex
- [x] Public webhook routes — código validado; ativação real pendente
- [x] Mercado Pago webhook signature — código validado; variável Production informada pelo usuário; callback real pendente
- [x] Sensitive logs — Etapa 4 validada localmente; detalhes em `sensitive-logs.md`
- [x] Monthly date ranges — Etapa 5 validada localmente; ver `monthly-date-ranges.md`
- [x] Prisma migration audit — Etapa 6 auditada sem tocar no banco; ver `prisma-migration-audit.md`
- [x] Next/Clerk security upgrade — Etapa 7 validada localmente; ver `next-clerk-security-upgrade.md`

Current step: Fase 0 concluída em código e auditoria local (Etapas 1–7, ressalvadas as pendências operacionais).
Last completed step: Etapa 7 — atualização de segurança Next/Clerk.
Current blockers: estado real do banco e migrações não verificados; `npm audit` indisponível (503); **PENDENTE — validação com credenciais/ambiente real do Mercado Pago**.
Next step: revisão manual local de calendário, login, assinatura e billing; planejar reconciliação segura de migrações antes de qualquer uso de banco real.

## Pendências

- **PENDENTE — validação com credenciais/ambiente real do Mercado Pago**: callback real, assinatura e efeito no plano; não bloqueia o trabalho local. Não acessar Vercel nem publicar sem autorização futura.
- Conferir estado real do PostgreSQL e histórico de migrações com backup e plano de recuperação antes de aplicar mudanças; consultar `prisma-migration-audit.md`.
- Repetir `npm audit` após cessar o erro 503 do registro e validar manualmente login, calendário, webhooks e billing.

## Ponto de parada

Etapas 1–3 registradas historicamente. Etapas 4–7 implementadas/auditadas e validadas somente no código local da branch `teste-webhook-local`; sem operação Git, deploy, migration aplicada ou alteração de segredo. A integração Mercado Pago não está concluída sem callback real.

## Próxima etapa

O plano de contenção local está concluído. Fazer revisão manual e resolver as pendências operacionais em ambiente autorizado, sem sincronização remota automática.
