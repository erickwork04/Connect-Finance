# Dashboard — separação entre realizado e previsto

## Objetivo e problema

Os cards iniciais misturavam saldo calculado com transações, disponível após compromissos e gastos fixos previstos. Isso exigia interpretar valores de naturezas diferentes na mesma área. Esta rodada torna a leitura principal Entradas, Total de gastos e Saldo, deixando compromissos e parcelas nas seções próprias.

## Decisão e arquitetura

- O topo não tem título visível. Um `h1` acessível permanece para identificar a página.
- Entradas usa `DEPOSIT`, Total de gastos usa `EXPENSE` e Saldo conserva `DEPOSIT − EXPENSE − INVESTMENT` do mês da URL. Os três cards mostram valores realizados; o Saldo recebe o maior destaque e conserva o botão original de adicionar transação.
- Investido (`INVESTMENT`) permanece em card secundário, após Últimas transações e Insight IA. Comparações com o mês imediatamente anterior continuam usando a função existente, com travessão quando a base anterior é zero.
- O valor “Disponível após compromissos” saiu da interface do Saldo. Compromissos pendentes não entram em Total de gastos nem são descontados do Saldo exibido. Um saldo realizado negativo continua possível quando as saídas efetivas superam entradas.
- Gastos fixos do mês deixaram de ser card principal. O valor calculado a partir de compromissos recorrentes aparece dentro de Compromissos do mês como **Gastos fixos previstos no mês**. A soma inclui ocorrências pagas e pendentes; é uma previsão cadastrada, não uma segunda despesa.
- Últimas transações, Insight IA, Gastos por categoria, Parcelamentos ativos e Cartão de crédito conservam seus dados e ações. O grid usa três cards no topo, com Saldo ocupando metade da largura em desktop; em tablet os dois valores menores ficam lado a lado e o Saldo ocupa a linha seguinte; em mobile os três se empilham.

## Recorrência e vínculo: estado atual e etapa futura

O cadastro existente materializa 12 ocorrências mensais de um compromisso recorrente, inicialmente pendentes. Não há renovação automática depois dessas 12 ocorrências. O vínculo manual existente associa uma despesa do mesmo usuário, mês e valor a uma ocorrência, marca o compromisso como pago e mantém o impacto financeiro apenas na transação. O campo `transactionId` é único, preservando a relação inicial de uma transação para um compromisso mensal.

Uma futura etapa poderá sugerir vínculo em cadastro manual e na revisão de importação já existente. Os critérios iniciais propostos são valor, proximidade do vencimento, descrição e categoria, sempre com confirmação explícita do usuário e opção de ignorar. Esta rodada não adiciona sugestão, matching automático, renovação além de 12 meses, pagamentos parciais, vários pagamentos por compromisso nem divisão de uma transação. Também não adiciona orçamento previsto por categoria ou por forma de pagamento.

## Arquivos e validação

- `app/dashboard/page.tsx`: ordem e largura dos cards, com título apenas para leitores de tela.
- `app/dashboard/_componets/dashboard-v2-cards.tsx`: cards de valores realizados, Saldo sem projeção e previsão recorrente na seção de compromissos.
- `docs/usabilidade/dashboard.md`: orientação do usuário para leitura de realizado e previsto.

Não há mudança de schema, migration, banco, consulta financeira, importação, Cartões, Metas, IA ou Premium. A consulta existente ainda calcula “disponível após compromissos” para compatibilidade do contrato de dados, embora o Dashboard não o apresente; uma limpeza desse campo pode ser considerada em refino interno posterior.

## Critérios de aceite e riscos

- O mês da navbar continua sendo a referência de todas as cifras e links financeiros.
- Entradas, gastos e saldo não incluem compromissos pendentes; os previstos aparecem somente na seção de compromissos.
- O botão de adicionar transação, a lista recente, o diálogo de compromissos e o relatório IA permanecem acessíveis.
- Desktop, tablet e mobile devem caber na viewport sem rolagem horizontal.
- O Saldo é um resultado do **mês selecionado**, não o saldo consolidado de uma conta bancária. O nome simples solicitado pode ser interpretado como saldo bancário atual; essa distinção deve continuar explícita nesta documentação e em suporte ao usuário.

## Resultado da validação

- 29 testes Node passaram; `npm run lint` terminou sem avisos ou erros; `npx tsc --noEmit` passou.
- `npm run build` parou em `prisma generate` com `EPERM` ao renomear a DLL local do Prisma, bloqueada por outro processo. Nenhum processo foi encerrado. `npx next build` concluiu, incluindo compilação, lint e verificação de tipos.
- A inspeção de desktop, tablet e mobile em navegador ficou pendente: a política do navegador automatizado recusou acesso a `http://localhost:3000`. A revisão estática confirma grades de uma coluna até 639 px, duas colunas de métricas entre 640 e 1023 px e três cards em grade de 12 colunas a partir de 1024 px. Isso não substitui a conferência de overflow, legibilidade e interação real.
- Em sessão autenticada, conferir o Dashboard em 1440, 768, 390 e 320 px; abrir o botão Adicionar transação e seus menus/dialogs; trocar o mês; verificar um mês com dados e outro vazio; comparar que compromisso pendente aparece apenas no bloco de compromissos e que compromisso pago vinculado conta só como despesa realizada.

A composição visual posterior está documentada em [14 — Dashboard: composição visual](14-dashboard-composicao-visual.md); sua ordem de cards e seus resultados de build substituem a descrição histórica desta rodada.
