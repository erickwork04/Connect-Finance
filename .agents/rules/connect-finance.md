# Connect Finance

- O plano Premium é identificado atualmente por `user.publicMetadata.subscriptionPlan === "premium"`.
- Não altere a regra de assinatura sem revisar Clerk, Mercado Pago e bloqueios Premium.
- Importação e relatório IA devem continuar respeitando as regras de acesso Premium.
- Filtros mensais devem incluir todo o mês selecionado e excluir corretamente o primeiro instante do mês seguinte.
- O mês selecionado no dashboard deve ser preservado via URL/searchParams.
- Alterações em transações importadas não podem perder valor, data, categoria ou origem.
- Mercado Pago real pode permanecer pendente durante desenvolvimento local, mas a pendência deve ser documentada.
- Não altere modelos financeiros ou regras de negócio sem verificar impacto em dashboard, importação, IA, assinatura e relatórios.

## Período financeiro global

- O mês selecionado na navbar é a referência temporal global das telas financeiras.
- O período deve ser representado por `month=YYYY-MM` na URL.
- Navegação entre telas financeiras deve preservar o mês selecionado.
- Dashboard, Transações, relatórios, faturas, parcelamentos e compromissos devem respeitar o período quando aplicável.
- Não mantenha uma segunda fonte de verdade para o mês em estado React global se a URL já contém o período.