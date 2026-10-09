# Cupons na assinatura Premium

## Fluxo anterior

A contratação enviava o token do cartão para uma Server Action que criava uma pré-assinatura do Mercado Pago vinculada ao plano configurado no ambiente. O valor de R$ 19,90 aparecia no formulário, mas não havia cupom nem registro local da assinatura. O webhook assinado de `subscription_preapproval` consultava a pré-assinatura e ativava o Premium no Clerk ao receber `authorized`; cancelamento e pausa removiam o estado apenas se o ID da assinatura correspondesse.

## Fluxo atual

O frontend envia somente o token do cartão e, opcionalmente, o código do cupom. O backend normaliza o código (`trim` e maiúsculas), valida elegibilidade, reserva o uso numa transação serializável e calcula o valor em centavos a partir do preço base de R$ 19,90. Uma nova pré-assinatura é criada com recorrência mensal e `transaction_amount` explícito. Assinaturas antigas e a regra de Premium no Clerk permanecem intactas. O valor mostrado no Brick é somente informativo; o servidor recalcula antes de chamar o Mercado Pago.

`PERCENTAGE` usa percentual do preço base, arredondado em centavos; `FIXED` subtrai um valor em reais. Cupons que deixariam a cobrança em zero ou abaixo disso são recusados, pois o fluxo atual exige cobrança por cartão. Apenas um cupom pode ser aplicado por contratação. O resumo na tela explica o valor cobrado hoje e o dos meses seguintes. O backend valida novamente no checkout, pois a disponibilidade pode mudar após a prévia.

## Persistência

A migration aditiva `20260924120000_subscription_coupons` cria:

- `Coupon`: código único, tipo, valor decimal, atividade, expiração, limite, usos confirmados e reservados, `firstCycleOnly`, datas.
- `CouponUsage`: cupom, usuário, assinatura e data; unicidade por cupom/usuário e assinatura.
- `MercadoPagoSubscription`: vínculo local com o ID do Mercado Pago, preço base/atual, cupom, estado, reserva, primeira cobrança aprovada e controle de restauração.

Não houve alteração ou exclusão de linhas preexistentes. As chaves estrangeiras usam `RESTRICT`, sem cascade delete. Índice parcial impede duas assinaturas locais abertas por usuário. A migration foi aplicada após `prisma validate` e conferência do estado das migrations. Nenhum cupom fictício foi inserido; o cadastro administrativo fica para outra etapa. Códigos devem ser cadastrados já normalizados em maiúsculas.

## Confirmação e idempotência

O webhook assinado também recebe `subscription_authorized_payment`. Ele busca a fatura no Mercado Pago, exige `payment.status=approved`, ID da pré-assinatura, moeda BRL e valor esperado. A primeira cobrança aprovada registra `CouponUsage` e transfere uma unidade de `reservedUses` para `currentUses` na mesma transação do banco. Unicidade e `firstPaymentApprovedAt` evitam duplicação em reentregas. Reservas e isolamento serializável impedem ultrapassar `maxUses` em checkouts concorrentes.

Para `firstCycleOnly`, a pré-assinatura começa com valor promocional. Depois da confirmação da primeira cobrança, o webhook faz `PUT /preapproval/{id}` para restaurar o preço base. Um lease em `restoreLockUntil` limita atualizações concorrentes; `couponRestored` é persistido depois da resposta. Reentregar o mesmo evento pode repetir o PUT com o **mesmo valor**, sem novo desconto nem novo uso. Se a atualização remota falhar, o webhook retorna erro para nova tentativa e a restauração fica pendente. Cupom permanente mantém o valor reduzido.

### Precedência de cancelamento

Eventos de cancelamento e pagamento bloqueiam a mesma linha local com `SELECT ... FOR UPDATE`; a atualização da linha e a gravação correspondente no Clerk acontecem dentro dessa seção serializada. Se o cancelamento já estiver confirmado, a cobrança aprovada ainda pode ser registrada e consumir a reserva do cupom, mas mantém `CANCELLED` e não grava Premium no Clerk. A deduplicação continua usando `firstPaymentApprovedAt`, `firstPaymentId` e as restrições únicas de `CouponUsage`. Um checkout posterior recebe outro ID local e outro `external_reference`, então o webhook da nova assinatura decide com o estado do registro novo.

O status `paused` recebido do Mercado Pago é tratado como encerramento e armazenado como `CANCELLED`; nenhuma transição local nova grava estado operacional de pausa. O valor enum legado no schema permanece por compatibilidade com banco já aplicado, sem ser escrito ou usado como estado ativo pelo fluxo atual.

Uma resposta inconclusiva do Mercado Pago durante a criação conserva a reserva para evitar liberar um cupom que possa ter sido aceito remotamente. Cancelamentos antes da cobrança também conservam a reserva até reconciliação, para proteger contra notificações tardias. **Pendente:** rotina administrativa de reconciliação/liberação dessas reservas após verificar o estado remoto. Ela é necessária antes de campanhas com capacidade apertada. O sistema não libera automaticamente um uso cujo pagamento ainda pode chegar.

## UX e segurança

Prévia de cupom, falhas de checkout, cobrança aprovada e andamento usam toasts com textos em português. Logs do servidor registram etapa, status e código técnico, sem token de acesso, cartão ou resposta integral do provedor. A página mostra valor mensal com desconto para assinaturas locais ativas. A ativação Premium no Clerk segue o webhook existente; a confirmação do primeiro pagamento controla o consumo do cupom e, quando necessário, a restauração do preço.

## Validação e pendências

Testes do fluxo de pagamento cobrem assinatura ativa, cancelamento antes da cobrança atrasada, duplicata, restauração `firstCycleOnly`, nova assinatura após cancelamento e escrita idempotente do Clerk. `npm run lint`, `npx tsc --noEmit` e `npm run build` passaram após esta correção.

A confirmação real do pagamento, a atualização do valor no Mercado Pago e a reentrega de webhooks dependem de homologação com credenciais/ambiente real. Configurar o tópico `subscription_authorized_payment` no webhook do Mercado Pago para a mesma URL e segredo já usados. Não houve alteração de credenciais.

**PENDENTE — validação com credenciais/ambiente real do Mercado Pago.** O painel administrativo de cupons não faz parte desta etapa.
