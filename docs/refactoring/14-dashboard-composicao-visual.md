# Dashboard — composição visual e hierarquia

## Objetivo e problema

Após separar os números realizados dos compromissos previstos, o Dashboard ainda colocava Investido sob Insight IA, gerando colunas de tamanhos diferentes e uma sequência pouco clara. Esta rodada reorganiza os cards em linhas previsíveis e dá acabamento distinto aos três destaques sem alterar dados financeiros.

## Decisão

- A grade desktop usa 12 colunas: Entradas (3), Total de gastos (3), Saldo (6); Investido (6) e Parcelamentos ativos (6); Últimas transações (6) e Insight IA (6); Gastos por categoria (6) e Compromissos do mês (6). Cartão de crédito ocupa a linha final e distribui nome/datas, faturas e limite em três áreas internas. Na coluna esquerda, Investido precede Últimas transações, Gastos por categoria e Cartão de crédito.
- O layout mantém Mulish, fundo escuro, verde da marca e bordas discretas. Saldo, Insight IA e Investido recebem gradientes CSS de baixo contraste, sem imagem externa, filtro de blur ou animação. O Saldo conserva destaque maior; o botão fica próximo ao valor.
- Últimas transações conserva a consulta de até dez registros do mês. O card tem altura desktop de 348 px e só a lista rola; a área comporta aproximadamente cinco linhas. No mobile, a lista tem altura máxima de 270 px, com o mesmo scroll interno. O cabeçalho e o link Ver todas ficam fora da rolagem.
- Gastos por categoria mantém total, filtro e valores reais. Quando existem mais de seis categorias, as cinco maiores categorias específicas aparecem individualmente; as restantes, inclusive a categoria Outros original, são agregadas visualmente em Outros. A soma e o total do gráfico não mudam.
- Compromissos recebe maior contraste e minirresumos; lista e diálogo mantêm as mesmas ações e o limite de dois itens no card. Parcelamentos tem estado vazio compacto com ícone já presente no projeto. Cartão de crédito mantém as cifras e o link Gerenciar.
- Até 639 px, todos os cards são empilhados. Entre 640 e 1023 px, os dois indicadores pequenos ficam lado a lado e Saldo ocupa a largura toda; as linhas seguintes têm uma coluna. A partir de 1024 px, as linhas descritas usam pares de meia largura. O Saldo põe o botão abaixo do número no início do breakpoint desktop e ao lado em telas mais largas, evitando aperto.
- O Saldo exibe uma onda SVG verde de baixa opacidade ao fundo, sem interceptar eventos. Ao lado do número, o botão conserva o fluxo existente e recebe uma microinformação de compromissos `PENDING` sem transação vinculada. A contagem usa `data.commitments` e o valor usa `data.commitmentsSummary.pending`, ambos já carregados por `getDashboard`; ausência de pendências e indisponibilidade da tabela têm textos distintos. Nada disso altera o cálculo do Saldo.

## Arquivos, testes e riscos

- `app/dashboard/page.tsx`: ordem e grade.
- `app/dashboard/_componets/dashboard-v2-cards.tsx`: composição, superfícies especiais, lista interna e estados dos cards.
- `app/dashboard/_componets/category-expenses-card.tsx`: agrupamento visual das categorias menos relevantes.
- `docs/usabilidade/dashboard.md`: ordem e comportamento para o usuário.

Nenhum schema, migration, consulta financeira, importação, autenticação, assinatura ou regra Premium foi alterado. A categoria Outros passa a representar, apenas no gráfico quando há mais de seis categorias, também outras categorias pequenas. O usuário ainda pode consultar cada transação e sua categoria original em Transações.

Os 29 testes Node passaram. `npm run lint` terminou sem avisos ou erros e `npx tsc --noEmit` passou. `npm run build` parou na etapa inicial `prisma generate` por `EPERM` ao renomear a DLL local bloqueada; nenhum processo foi encerrado. `npx next build` passou, incluindo compilação, lint e checagem de tipos.

A validação visual e funcional autenticada ficou pendente: o navegador automatizado recusou acesso a `http://localhost:3000` por não conseguir verificar uma política de segurança do ambiente. A inspeção estática confirma os breakpoints e que os controles existentes permanecem nos componentes originais, mas não comprova ausência de overflow nem interação real. Em sessão autenticada, inspecionar 1440, 1280, 768, 390 e 320 px, com zero e dez transações, usuário gratuito e Premium, valores longos, abertura do botão Adicionar transação, filtro de categorias, scroll da lista e diálogo de compromissos.
