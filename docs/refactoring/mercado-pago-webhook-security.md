# Mercado Pago webhook security

## Objetivo

Autenticar o webhook Mercado Pago antes de processar notificações e impedir que callbacks inválidos alterem o plano Premium.

## Problema encontrado

O handler antigo aceitava qualquer JSON com `type=subscription_preapproval` e `data.id`, consultava a API do Mercado Pago e alterava metadata do Clerk. Essa consulta obtinha o estado de uma assinatura, mas não comprovava que a solicitação ao webhook veio do provedor. O corpo completo ainda era registrado em log e mensagens internas de erro eram devolvidas ao cliente.

## Evidência

- `app/api/webhooks/mercado-pago/route.ts` anteriormente não lia `x-signature` ou `x-request-id`.
- A [documentação oficial de Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/links-and-debts/additional-content/your-integrations/notifications/webhooks?scope=prod) descreve `x-signature: ts=...,v1=...`, `x-request-id`, o `data.id` da URL e o manifesto `id:[data.id];request-id:[x-request-id];ts:[ts];`, assinado com HMAC-SHA256 e a chave secreta da integração. A [orientação complementar](https://www.mercadopago.com.br/developers/pt/docs/wallet-connect/notifications) manda normalizar `data.id` para minúsculas na validação.
- O corpo contém `type`, `data.id` e possivelmente `id` do evento. O código atual só consome `subscription_preapproval`; não havia armazenamento de `id` nem deduplicação persistente.
- Somente nomes de variáveis locais foram inspecionados. Não havia chave `MERCADO_PAGO_WEBHOOK_SECRET` em `.env` ou `.env.example` antes desta etapa; nenhum valor secreto foi exibido ou versionado.

## Arquivos envolvidos

- `app/api/webhooks/mercado-pago/route.ts` (alterado).
- `app/api/webhooks/mercado-pago/verify-signature.ts` (novo helper puro).
- `app/api/webhooks/mercado-pago/verify-signature.test.mjs` (novos testes locais).
- `.env.example` (nova variável, sem valor).
- `middleware.ts` (liberação exata da rota na Etapa 2).
- `docs/refactoring/mercado-pago-webhook-security.md` e `phase-0-overview.md` (registro).

## Alterações realizadas

- A rota exige access token e segredo de webhook configurados; sem eles responde `503` e não processa nada.
- Lê exatamente um `data.id` da URL; valida `x-signature`/`x-request-id`, formato de `ts` e HMAC-SHA256 com comparação em tempo constante, antes de ler o corpo ou consultar a API.
- Rejeita assinatura ausente/incorreta (`401`), corpo inválido ou `data.id` do corpo divergente da URL assinada (`400`). Usa apenas o ID validado da URL, codificado no caminho, ao consultar a assinatura.
- Consulta o estado atual no Mercado Pago como antes. Antes de atualizar o Clerk, verifica o estado atual do usuário: callback repetido de assinatura já ativa não escreve novamente; cancelamento/pausa só limpa o plano se o ID armazenado corresponder à assinatura notificada. Isso reduz duplicação e impede que uma assinatura antiga cancelada remova uma mais nova.
- Removeu o log do payload bruto desta rota e trocou a resposta de erro interno por mensagem genérica. A auditoria geral de logs permanece na Etapa 4.
- `.env.example` agora documenta `MERCADO_PAGO_WEBHOOK_SECRET=` sem valor.

## Decisões técnicas

- Seguir o manifesto oficial; `ts` é usado como parte da assinatura, mas não como janela de expiração. A documentação consultada mostra exemplos em segundos e milissegundos, e o provedor pode reenviar notificações. Uma janela arbitrária poderia bloquear callbacks legítimos. A mitigação atual de replay é reconsultar o estado vivo e evitar escritas repetidas; não equivale à deduplicação durável por evento.
- Não criar `BillingEvent`/tabela de idempotência nem alterar o modelo de assinatura nesta contenção. Esse é trabalho posterior, com análise de migração.
- Manter o tópico e a atualização Premium existentes, sem redesenhar checkout, pagamentos ou autenticação.
- Rejeitar notificações antigas no formato IPN/sem `data.id` assinado. A configuração do provedor deve usar Webhooks com segredo, não IPN.

## Riscos

- **Operacional:** o segredo foi configurado pelo usuário no `.env` local e validado somente quanto à presença, sem ler seu valor. O usuário confirmou a variável em Production na Vercel; o Codex não conseguiu verificar o painel diretamente. Sem a variável no novo deployment, callbacks legítimos receberão `503`.
- **Replay residual:** um evento assinado pode ser reenviado; sem ledger persistente não há prova de processamento exatamente uma vez. A leitura do estado atual e as guardas de metadata evitam reescrita repetida e cancelamento de outra assinatura, mas não resolvem totalmente concorrência ou múltiplas assinaturas ativas.
- **Integração:** nenhum callback real de sandbox/produção foi testado. Confirmar headers, query `data.id`, tópico `subscription_preapproval`, segredo e status retornado pelo provedor.
- **Metadata Premium:** Stripe e Mercado Pago compartilham `subscriptionPlan`; o modelo atual não distingue entitlements por provedor. Não foi redesenhado nesta etapa.

## Validações executadas

- Testes locais de HMAC: assinatura válida, adulteração de hash/request-id/ID, headers ausentes, duplicados e formato inválido — 3 testes passando via `node --experimental-strip-types --test app/api/webhooks/mercado-pago/verify-signature.test.mjs`.
- `tsc --noEmit --incremental false`, `npm run lint` e `npm run build`: passaram. `package.json` não oferece scripts `typecheck` nem `test`; não foram inventados.
- Teste HTTP local em `next start` com segredo fictício apenas na variável do processo: notificação assinada de tipo não tratado recebeu `200`, assinatura inválida recebeu `401`; sem segredo, a rota respondeu `503`. Esse teste não chamou a API Mercado Pago nem alterou Clerk.
- Após configuração manual do `.env`, verificação booleana da presença da variável (sem imprimir valor) e novo teste local: chamada sem assinatura recebeu `401`; `/dashboard` continuou protegido (`307 /login`). Não houve teste contra a Vercel, pois o painel exigiu login.
- `git diff --check`, revisão de diff e estado Git. Não houve commit, push, alteração de banco ou mudança de segredo real.

## Resultado

**Etapa 3 concluída em código e validada localmente.** Requisições não autenticadas não chegam à lógica de pagamento. O usuário confirmou a configuração Production da Vercel, mas a ativação e validação ponta a ponta dependem de publicar este código e testar uma notificação real.

## Pendências

- O usuário confirmou `MERCADO_PAGO_WEBHOOK_SECRET` em Production na Vercel; se desejado, conferir visualmente apenas nome e ambiente, sem revelar o valor. Publicar o novo código após autorização. O `.env` local já contém um valor, mas seu conteúdo não foi lido nem enviado ao Git.
- Verificar no painel o endpoint, tópico e modo (teste/produção), e executar um callback real de ponta a ponta antes de considerar o billing operacional.
- Em fase futura, persistir IDs de eventos e reconciliar múltiplas assinaturas/provedores para idempotência e ordenação robustas.

## Ponto de parada

Após validação de assinatura, testes locais e liberação exata da rota no Clerk. Etapa 4 não iniciada. Sem commit e sem push.

## Próxima etapa

Revisar as mudanças, publicar mediante autorização e validar callback real; depois, mediante autorização separada, seguir para a Etapa 4 — remoção geral de logs sensíveis.
