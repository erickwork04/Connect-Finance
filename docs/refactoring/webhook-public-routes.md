# Public webhook routes

## Objetivo

Permitir callbacks dos provedores sem sessão Clerk somente em `/api/webhooks/stripe` e `/api/webhooks/mercado-pago`, mantendo as demais rotas protegidas e exigindo autenticação própria em cada handler.

## Problema encontrado

O middleware anterior redirecionava ambas as rotas de webhook para `/login`, pois o matcher abrangia `/api` e a lista pública continha apenas páginas. O Stripe já verificava `stripe-signature`; o Mercado Pago não verificava `x-signature`, por isso a abertura desta rota foi bloqueada até a Etapa 3 ser implementada na mesma unidade de mudança.

## Evidência

- Antes: `isPublicRoute` continha `/`, `/login(.*)`, `/privacy` e `/terms`, mas não os webhooks.
- [Clerk](https://clerk.com/docs/guides/development/webhooks/debugging): provedores chegam sem sessão, então a rota do webhook deve ser pública.
- Depois: requisições locais sem sessão retornaram `503` para Mercado Pago sem segredo configurado e `400` para Stripe sem assinatura/configuração; nenhuma foi redirecionada. `/dashboard` ainda retornou `307` para `/login`.
- A validação HMAC do Mercado Pago foi implementada antes da abertura; ver `mercado-pago-webhook-security.md`.

## Arquivos envolvidos

- `middleware.ts` (alterado).
- `app/api/webhooks/stripe/route.ts` (analisado, não alterado).
- `app/api/webhooks/mercado-pago/route.ts` e `verify-signature.ts` (Etapa 3, alterados em conjunto por dependência de segurança).
- `docs/refactoring/webhook-public-routes.md` e `phase-0-overview.md` (atualizados).

## Alterações realizadas

Adicionados ao `createRouteMatcher` apenas os caminhos exatos `/api/webhooks/stripe` e `/api/webhooks/mercado-pago`. Não foi aberto `/api/webhooks/*`, `/api/*`, nenhuma página ou rota de usuário.

## Decisões técnicas

- Tratar a Etapa 3 como pré-requisito da abertura da rota Mercado Pago, com autorização do usuário. As Etapas 2 e 3 foram implementadas e validadas como uma unidade de segurança.
- Preservar o restante do comportamento do middleware, inclusive o redirecionamento de rotas autenticadas.
- Manter a assinatura do provedor no handler; a exclusão do Clerk não é autenticação de webhook.

## Riscos

- O segredo está presente no `.env` local após configuração manual do usuário, e ele confirmou a variável em Production na Vercel. O painel não foi verificado diretamente pelo Codex. Sem a variável no deployment do novo código, o endpoint responde `503`; falha fechada, sem bypass.
- Nenhum callback real do provedor foi executado. É necessário conferir no painel Mercado Pago o webhook, tópico `subscription_preapproval` e segredo correspondente ao ambiente.
- O Stripe continua com seus erros e fluxo de assinatura existentes; não foi refatorado nesta etapa.

## Validações executadas

- `npm run lint`: sem avisos ou erros.
- `tsc --noEmit --incremental false`: sem erros (não há script `typecheck`).
- `npm run build`: compilação, lint e coleta de páginas concluídos; ambas as rotas aparecem no build.
- Teste HTTP em `next start`: `POST /api/webhooks/mercado-pago?data.id=test` sem segredo local → `503`, sem redirect; `POST /api/webhooks/stripe` sem assinatura → `400`, sem redirect; `GET /dashboard` sem sessão → `307` para `/login`.
- Revisão do diff, `git status` e `git diff --check`. Não existe script `test` no `package.json`; testes específicos de assinatura executados via `node --experimental-strip-types --test`.

## Resultado

**Etapa 2 concluída em código e validada localmente.** As duas rotas exatas são públicas no Clerk; o Mercado Pago rejeita chamadas sem autenticação própria. A ativação operacional depende do segredo real no ambiente.

## Pendências

- O usuário confirmou a variável em Production na Vercel; publicar as alterações de código após autorização e testar uma notificação legítima de ponta a ponta, sem comitar o segredo.
- Revalidar após eventual upgrade do Clerk na Etapa 7.

## Ponto de parada

Etapas 2 e 3 implementadas como unidade; nenhuma outra API ou página foi liberada. Sem commit e sem push.

## Próxima etapa

Após revisão e autorização, executar uma entrega controlada e validar callback real; autorizar separadamente a Etapa 4 — remoção geral de logs sensíveis.
