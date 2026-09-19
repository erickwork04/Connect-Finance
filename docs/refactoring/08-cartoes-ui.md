# 08 — Cartões UI

**Objetivo:** criar a apresentação de cartões, limite, fatura e parcelas sem alterar dados financeiros.

**Situação atual:** `/cards` é uma rota privada com título, botão de adicionar cartão e estado explícito de indisponibilidade. `CardOverview` recebe por props nome, bandeira, limites total/usado/disponível, fechamento, vencimento, fatura e contagem de parcelas. Não existe cadastro de cartões no schema.

**Problema:** `paymentMethod=CREDIT_CARD` e importação de fatura não identificam cartão, ciclo nem compra parcelada. Inferir tais dados geraria informação incorreta ou duplicidade.

**Decisão e alterações:** separar `CardsPage` (autenticação) de `CardsScreen` (apresentação); usar `null` até existir fonte de dados e array na integração futura. O botão de cadastro está desabilitado com explicação. `CardOverview` não calcula nem persiste limites/fatura: exibe valores recebidos de uma fonte futura. A área de parcelas está preparada sem simular lançamentos.

**Arquivos/componentes:** `app/cards/page.tsx`, `app/cards/_components/cards-screen.tsx`, `card-overview.tsx`, `app/_components/feature-empty-state.tsx`, navbar e configuração central de rotas.

**Testes e critérios de aceite:** rota sem sessão redirecionou a `/login` (307); card de apresentação e estado indisponível inspecionados em desktop (1280 px), tablet (768 px) e mobile (375/320 px), sem overflow; menu mobile navega para Cartões e destaca a aba. Antes de habilitar cadastro, aprovar entidades, regras de limite, fechamento/vencimento, fatura, parcelas e conciliação idempotente.

**Pendências e riscos:** backend/banco, cadastro, ciclos, conciliação e testes com cartões reais. A prévia visual com valores de exemplo foi temporária e removida; nenhum cartão fictício aparece no fluxo real. A divergência de migrations continua documentada, sem aplicação.

**Status:** EM ANDAMENTO — camada visual concluída; funcionalidades financeiras dependem de backend e modelagem autorizados.
