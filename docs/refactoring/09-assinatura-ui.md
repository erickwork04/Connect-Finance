# 09 — Assinatura UI

**Objetivo:** exibir plano atual, status, valor, benefícios e ações com estados de carregamento/erro, sem homologar pagamentos.

**Situação atual:** o plano continua determinado por `publicMetadata.subscriptionPlan === "premium"` no servidor. A contagem mensal de transações continua vindo do serviço existente. O valor de R$ 19,90/mês foi preservado da tela anterior.

**Problema:** a página anterior não destacava o plano atual, não tinha loading/error específicos, e o botão “Gerenciar plano” Premium não possuía ação. O botão cliente também podia interpretar metadata ainda não carregada como plano gratuito.

**Decisão e alterações:** `SubscriptionPage` autentica, consulta Clerk e contagem mensal sem waterfall desnecessária e passa somente booleano/contagem para `SubscriptionScreen`. A tela mostra plano ativo e comparação Gratuito/Premium. `AcquirePlanButton` recebe o status do servidor; o formulário Mercado Pago existente é carregado apenas quando o usuário abre a contratação. O formulário mostra processamento e erro genérico sem expor detalhes internos. Gerenciamento Premium fica desabilitado com justificativa, sem link fictício. `loading.tsx` e `error.tsx` apresentam estados responsivos.

**Arquivos/componentes:** `app/subscription/page.tsx`, `_components/subscription-screen.tsx`, `_components/acquire-plan-button.tsx`, `_components/mercado-pago-payment.tsx`, `loading.tsx`, `error.tsx`, `PageHeader` e navbar. Nenhuma Server Action, webhook ou variável de ambiente foi alterada.

**Testes e critérios de aceite:** plano gratuito inspecionado em desktop (1280 px), tablet (768 px) e mobile (375 px); Premium em tablet/mobile; loading e erro em mobile. Não houve overflow horizontal. Premium não exibe CTA de compra e informa indisponibilidade do gerenciamento; erro oferece nova tentativa. Validar visual Premium/loading/erro também em desktop com sessão real antes de publicar; contratação/retorno e gerenciamento só estarão completos após implementação e homologação autorizadas.

**Pendências e riscos:** gerenciamento online não implementado; estado de assinatura ainda depende da metadata Clerk, sem domínio próprio de billing. **PENDENTE — validação com credenciais/ambiente real do Mercado Pago**. A prévia temporária não realizou pagamento nem usou credenciais reais.

**Status:** EM ANDAMENTO — UI concluída; gerenciamento e validação real de pagamentos pendentes.
