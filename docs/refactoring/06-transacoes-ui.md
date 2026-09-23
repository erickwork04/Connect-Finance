# 06 — Transações UI

## Estrutura implementada

A página mantém `Navbar` e a leitura de `month=YYYY-MM` na URL. O Server Component consulta as transações desse mês uma vez, seleciona apenas os campos usados na tela e preserva a verificação existente de permissão para adicionar transações. O DTO serializado alimenta `TransactionsScreen`; busca, categoria e recorte de dias são filtros locais, sem novas requisições. A troca do mês global recria a tela com os dados do novo período.

No desktop, a coluna principal contém cabeçalho visual, quatro totais, barra de filtros e tabela. A coluna lateral contém resumo, distribuição de despesas e insights determinísticos. Em tablet e mobile, a lista usa cartões com os mesmos valores e ações; a análise fica depois da lista. A grade desktop usa sidebar de 310–320 px, com conteúdo que pode encolher sem overflow horizontal.

O cabeçalho de Transações segue a referência visual fornecida: painel escuro com borda e luz verde suaves, título maior e bloco auxiliar no desktop. O bloco auxiliar é ocultado no mobile. A linha “Movimentações” foi removida; a lista mantém nome acessível. Na tabela, “Valor” e os números usam alinhamento à direita e quantias sem quebra. As categorias mostram ícones Lucide específicos para os oito valores existentes no enum, com as cores de categoria já usadas pelo sistema. Os cartões mobile reutilizam a mesma apresentação.

## Dados e cálculos

- Receita: soma `DEPOSIT`; despesas: soma `EXPENSE`; investimento: soma `INVESTMENT`; saldo: a função compartilhada `monthlyBalance(receita, despesas, investimento)`.
- Todos os indicadores são calculados sobre a lista visível após os filtros locais. `Ticket médio` é a média do valor absoluto de todas as transações visíveis. Somatórios usam centavos inteiros durante a agregação.
- Maior receita e maior despesa vêm das transações visíveis. A distribuição agrupa somente `EXPENSE` por categoria e usa a paleta já centralizada em `TRANSACTION_CATEGORY_COLORS`.
- Os insights são frases derivadas dos dados visíveis, exibidas apenas quando há ao menos duas transações; não há IA nem chamada externa. Sem despesas, o gráfico mostra estado vazio.
- `Todo o mês` usa o mês da URL. Os recortes de 7, 15 e 30 dias terminam hoje quando o mês selecionado é o mês atual; para meses históricos, terminam no último dia daquele mês. A busca por descrição ignora acentos e maiúsculas.

## Reuso e limites

Foram reutilizados `DataTable`, `AddTransactionButton`, os botões e diálogos de edição/exclusão, `Select`, `Input`, `formatCurrency`, `monthlyBalance`, o DTO de transação e as constantes de categoria/método. O donut segue a técnica de gradiente cônico já adotada no Dashboard, sem incluir Recharts no pacote desta página. Os fluxos de criação, importação, autenticação, Premium e regras financeiras existentes não foram alterados. O filtro de categorias apresenta as categorias reais definidas pelo domínio, inclusive as sem transações no mês.

## Validação

Testes unitários cobrem agregação, distribuição exclusiva de despesas, busca, filtros combinados, recorte histórico/atual e estados vazios. A verificação visual local cobriu 1366, 1440, 1600, 1920, 768, 375 e 320 px, sem overflow horizontal; busca, categoria, período, estados vazios e abertura dos diálogos existentes foram inspecionados em uma prévia temporária, removida após a validação. A submissão autenticada de criação, edição e exclusão precisa ser conferida manualmente com uma conta real; nenhum dado foi escrito durante a prévia.

Na implementação inicial, 29 testes, `npm run lint` e `npx tsc --noEmit` passaram. `npm run build` parou em `prisma generate` por `EPERM` ao renomear a DLL local do Prisma; nenhum processo foi encerrado. `npx next build` passou, incluindo checagem de tipos e geração das rotas. A troca do donut de Recharts pelo gradiente cônico existente no Dashboard reduziu o tamanho da rota de Transações no relatório daquele build de 118 kB para 20,1 kB.

No refino visual do cabeçalho e da lista, os 29 testes, `npm run lint`, `npx tsc --noEmit` e `npx next build` passaram. `npm run build` voltou a parar no mesmo bloqueio `EPERM` do Prisma. A prévia local temporária foi removida após verificar 1920, 1600, 1440, 1366, 1280, 1024, 768, 375 e 320 px sem overflow horizontal. O cabeçalho “Valor” e uma quantia longa terminaram na mesma coordenada à direita; a quantia manteve `white-space: nowrap`. Foram verificados os oito ícones de categoria e o estado vazio após busca. Não houve gravação de transações.

## Auditoria de interação mobile (setembro de 2026)

**Problema e causa.** Após uma compilação de produção com o servidor `next dev` ainda ativo, ambos usavam `.next`. O build substituiu os artefatos da sessão de desenvolvimento: o HTML da página ainda referenciava `/_next/static/chunks/main-app.js` e `app-pages-internals.js`, mas ambos retornavam 404. A folha de estilo também havia desaparecido nessa colisão. A página renderizava HTML, porém sem hidratação React; busca, filtros e botões pareciam presentes, mas não executavam ações. `document.elementFromPoint` no centro dos controles visíveis encontrou o próprio controle ou descendente, sem overlay interceptando eventos. Isso afeta qualquer página aberta depois da colisão; uma aba desktop já hidratada pode continuar funcionando e esconder o defeito.

**Correção.** `next.config.mjs` usa `.next-dev` apenas em `NODE_ENV=development`, mantendo o build de produção em `.next`; `.gitignore` ignora a nova saída. O servidor de desenvolvimento recompilou seus scripts, e uma nova execução de `npm run build` deixou CSS, `main-app.js` e `app-pages-internals.js` do servidor local com HTTP 200. A mudança não toca banco, autenticação, importação ou regras financeiras. Na tela de Transações, Editar/Excluir, busca e filtros têm áreas de 44 px no mobile, conservando dimensões desktop. O `DatePicker` compartilhado fecha o popover após escolher uma data, e o botão de fechar dos diálogos tem área de 40 px no mobile. Nenhum z-index foi aumentado sem diagnóstico.

**Validação.** Uma prévia pública temporária com duas transações locais, sem persistência e removida ao final, permitiu acionar Adicionar → formulário → Cancelar, categoria, período, busca, estados filtrado/vazio, Editar → Cancelar, Excluir → Cancelar, calendário, select do formulário e menu da navbar. A mesma interação foi repetida após rolagem. Em viewports configurados para 375, 390, 412, 768 e 1440 px, `scrollWidth` não excedeu `clientWidth`; a tabela apareceu no desktop e os cartões no mobile/tablet. `document.elementFromPoint` confirmou ausência de bloqueio sobre os filtros e o botão Adicionar. Em 1440 px, os fluxos de adicionar, editar, excluir e filtro continuaram funcionando. Depois da remoção da prévia, 29 testes, lint, typecheck e `npm run build` passaram.

**Limite e pendência.** O navegador automatizado disponível nesta sessão oferece alteração de viewport e clique, mas não expõe eventos de toque nem teclado virtual. Portanto, o teste por toque em um dispositivo real ou em DevTools com emulação de toque continua obrigatório antes de declarar a falha mobile encerrada. Confirmar especialmente abertura/fechamento dos menus e diálogos, escolha de categoria/período/data, edição, exclusão sem confirmar, rolagem e retorno ao botão, nas larguras 375, 390 e 412 px. A prévia usou dados locais; os fluxos autenticados e gravações não foram executados.
