# Migração de pagamentos para a Cakto

## Situação

O código agora inicia novas assinaturas Premium pelo checkout hospedado da Cakto e recebe seus eventos em `/api/webhooks/cakto`. O Premium continua sendo refletido em `publicMetadata.subscriptionPlan` no Clerk; o ID interno da assinatura Cakto fica em `privateMetadata.caktoBillingSubscriptionId`.

A migration Prisma é aditiva e preserva os registros que já estavam na tabela física `MercadoPagoSubscription`. O modelo Prisma foi generalizado para `BillingSubscription`; novas linhas usam `CAKTO`. As migrations `20261009150000_cakto_billing` e `20261011110000_remove_internal_coupons` foram aplicadas ao banco de produção em 2026-10-11; `npx prisma migrate status` confirmou o schema atualizado.

O Connect Finance usa exclusivamente a Cakto para novas assinaturas. As rotas, bibliotecas e dependências executáveis do Mercado Pago e Stripe foram removidas. A estrutura e os registros históricos no banco foram preservados; o sistema não processa mais eventos dos provedores antigos.

## Arquitetura anterior

- O formulário `@mercadopago/sdk-react` tokenizava o cartão no navegador.
- Uma Server Action criava uma assinatura Mercado Pago e reservava cupons no Prisma.
- O webhook Mercado Pago consultava a API do provedor, verificava HMAC e atualizava Prisma/Clerk.
- `publicMetadata.subscriptionPlan` era a fonte usada pelos controles de acesso.

## Arquitetura atual

- O botão autenticado cria no Prisma uma sessão pendente com token aleatório opaco e devolve um link de checkout hospedado da Cakto com `?callback=<token>`.
- O navegador não escolhe preço, oferta, usuário ou produto. O servidor usa somente o produto/oferta configurados no ambiente.
- O webhook valida `X-Cakto-Timestamp` e `X-Cakto-Signature` sobre o corpo bruto com HMAC-SHA256 e também confere o campo `secret` do JSON.
- Só são processados pedidos de assinatura com IDs configurados, callback previamente emitido, e-mail de compra pertencente à conta Clerk e valor igual ao preço persistido.
- Eventos Cakto ficam registrados em `CaktoWebhookEvent` e são idempotentes por evento e pedido. Datas do provedor impedem que eventos antigos sobrescrevam um estado mais recente.
- A confirmação do checkout no navegador nunca libera Premium; apenas um evento autenticado e validado pode fazê-lo.

## Arquivos alterados

- Checkout: `app/subscription/_components/acquire-plan-button.tsx`, `cakto-checkout.tsx`, `app/subscription/_actions/create-cakto-checkout/index.ts`.
- Webhook e validação: `app/api/webhooks/cakto/route.ts`, `verify-signature.ts`, `app/subscription/_lib/cakto-events.ts`, `cakto-event-policy.ts`.
- Banco: `prisma/schema.prisma`, migration `20261009150000_cakto_billing`.
- Assinatura e rotas públicas: `app/subscription/page.tsx`, `middleware.ts`.
- Configuração: `.env.example`.
- Dependências removidas: `@mercadopago/sdk-react`, `stripe` e `@stripe/stripe-js`.
- Rotas de webhook, validação de assinatura, processadores de eventos e configuração de ambiente do Mercado Pago e Stripe foram removidos.
- Assinaturas antigas continuam armazenadas para preservar o histórico, mas não são mais processadas pelo aplicativo.

## Variáveis de ambiente

Configure no ambiente local e na Vercel, mantendo segredos exclusivamente no servidor:

| Variável | Finalidade |
| --- | --- |
| `CAKTO_PREMIUM_PRODUCT_ID` | ID do produto recorrente Premium na Cakto. |
| `CAKTO_PREMIUM_OFFER_ID` | ID da oferta mensal que será usada no checkout. |
| `CAKTO_PREMIUM_CHECKOUT_URL` | URL HTTPS exata da oferta, no formato `https://pay.cakto.com.br/<id-da-oferta>`. |
| `CAKTO_WEBHOOK_SECRET` | Segredo do webhook Cakto; a Cakto usa esse valor para assinar o corpo. |

`APP_URL` existente continua sendo a URL pública da aplicação. Remova também as chaves antigas de Mercado Pago e Stripe dos ambientes locais e da Vercel; não compartilhe os valores dessas chaves.

## Configuração manual na Cakto

1. No painel, crie um produto de assinatura Premium em BRL por **R$ 19,90**, com ciclo mensal. Use uma recorrência mensal consistente com a configuração de oferta da conta.
2. Copie os IDs do produto e da oferta padrão e cadastre-os nas três variáveis `CAKTO_PREMIUM_*`. A URL precisa corresponder exatamente ao ID de oferta configurado.
3. Cadastre um webhook HTTPS com URL `https://<dominio-publico>/api/webhooks/cakto`.
4. Marque os eventos `purchase_approved`, `purchase_refused`, `subscription_renewed`, `subscription_renewal_refused`, `subscription_paused`, `subscription_resumed`, `subscription_late`, `subscription_late_recovered`, `subscription_canceled`, `refund` e `chargeback`.
5. Copie o segredo gerado para `CAKTO_WEBHOOK_SECRET` no ambiente de deploy. Não o coloque em variável `NEXT_PUBLIC_*`.
6. Use o teste de webhook no painel para verificar conectividade e assinatura. O payload de teste não prova que um pedido real, produto, oferta, callback ou pagamento será aceito pelo código.
7. Faça uma compra de homologação permitida pela conta e confirme a ativação no Clerk e no banco. Depois teste cancelamento, renovação, reembolso e chargeback no ambiente aprovado pela Cakto.

O callback opaco é acrescentado pelo servidor a cada URL de checkout e é devolvido no webhook. A documentação Cakto informa que o recurso opcional de redirecionamento pós-pagamento precisa ser liberado caso a caso. Se aprovado, configure no produto uma URL como `https://<dominio-publico>/subscription?checkout={{callback}}`. Esse retorno serve somente para UX; a aplicação continua dependendo do webhook.

## Eventos e acesso Premium

- `purchase_approved` e `subscription_renewed`: ativam ou renovam o acesso apenas com `status: paid`, valor esperado e conta associada.
- `subscription_resumed` e `subscription_late_recovered`: reativam somente se vierem como pedido pago e validado.
- `subscription_paused`, `subscription_late` e `subscription_renewal_refused`: marcam a assinatura como pausada e retiram o acesso desta assinatura.
- `subscription_canceled`, `refund` e `chargeback`: encerram a assinatura e retiram o Premium quando o ID privado do Clerk corresponde àquela assinatura.
- `purchase_refused`: marca a sessão como falha sem liberar Premium.
- Tipos desconhecidos, produto/oferta incorretos, valor divergente, callback ausente/desconhecido, e-mail que não pertence à conta e evento atrasado são ignorados sem conceder acesso.

A Cakto documenta que uma resposta não-2xx pode não ser reenviada automaticamente; o painel permite acompanhar e reenviar entregas. Se a sincronização Prisma/Clerk falhar, o registro permanece pendente para uma nova tentativa manual, que pode ser reprocessada com segurança.

## Cupons

Os cupons são criados e validados diretamente pela Cakto. O comprador informa o código no checkout hospedado; se o campo não aparecer, habilite a exibição do campo de cupom nas configurações do produto/oferta. A Cakto também permite pré-aplicar um cupom adicionando `?coupon=<codigo>` à URL do checkout.

O Connect Finance não mantém mais um cadastro, cálculo, limite ou histórico próprio de cupons. O webhook confere que `baseAmount` continua igual ao preço mensal configurado e que `amount + discount` fecha esse valor antes de ativar o Premium; o desconto e as regras de primeira cobrança são controlados pela Cakto.

As tabelas locais `Coupon` e `CouponUsage` e os campos de cupom da assinatura foram removidos pela migration `20261011110000_remove_internal_coupons`, aplicada ao banco de produção em 2026-10-11.

## Dados históricos dos provedores antigos

As rotas e credenciais do Mercado Pago e Stripe foram removidas por não haver clientes ativos nesses provedores. Os campos e registros antigos no banco permanecem preservados para evitar perda de histórico; eles não habilitam processamento ou cobranças pelo Connect Finance. As migrations Cakto foram aplicadas ao banco de produção em 2026-10-11.

## Migration e comandos

A migration de integração adiciona o provedor e identificadores Cakto à tabela existente e cria a tabela de auditoria de eventos. A migration de limpeza remove as tabelas e campos do controle local de cupons; ela não apaga assinaturas nem registros de eventos Cakto. Ambas foram aplicadas ao banco de produção em 2026-10-11.

Após backup e revisão do SQL, aplique no ambiente correto com:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Para desenvolvimento local, use `npx prisma migrate dev` somente com banco local apropriado e após conferir `DATABASE_URL`. No banco de produção configurado nesta máquina, as migrations foram aplicadas com `npx prisma migrate deploy` e o status foi confirmado com `npx prisma migrate status`.

Validação local:

```powershell
npm ci
node --experimental-strip-types --test app/api/webhooks/cakto/verify-signature.test.mjs app/subscription/_lib/cakto-event-policy.test.mjs
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

## Pendências de homologação e produção

- Cadastrar produto/oferta, variáveis e webhook no painel Cakto.
- Aplicar a migration em cada banco após backup; isso não foi feito aqui.
- Confirmar com evento real que `callback`, IDs da oferta/produto e e-mail chegam como documentado, inclusive nos eventos recorrentes, pausa e cancelamento.
- Homologar o ciclo de renovação e confirmar o comportamento do Premium conforme a política de atraso da conta Cakto.
- Definir o caminho seguro para cupons Connect Finance antes de voltar a oferecê-los no checkout.
- Remover manualmente as chaves Mercado Pago/Stripe dos ambientes da Vercel e do `.env` local, se ainda estiverem configuradas.
- Verificação em 2026-10-11 com Node `v24.18.0`: `npm run build` passou depois de gerar o Prisma Client. As migrations foram aplicadas e `prisma migrate status` confirmou o schema atualizado. O botão foi testado no app local e abriu o checkout hospedado da Cakto; nenhum pagamento foi efetuado. A aplicação ainda não foi publicada.
- A homologação com Clerk/Cakto reais, testes visuais em desktop/mobile e sincronização efetiva de renovação/cancelamento ainda dependem da configuração de conta e webhook descrita acima.
