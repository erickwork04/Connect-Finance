# Refino desktop e formulários financeiros

## Escopo e arquitetura

Esta rodada conserva o Dashboard V2 e seus modelos. Não houve migration, escrita direta no banco, operação Git, deploy ou alteração de credenciais. A identidade escura/verde e a ordem mobile foram preservadas. A referência temporal permanece `month=YYYY-MM` na URL; o seletor visual é um Popover de meses em pt-BR (`MonthPicker`), controlado por `useSearchParams` na navbar. A escolha faz `router.push` com os demais parâmetros preservados; recarregar a página mantém o mês. O calendário de data completa usa `Calendar` com `date-fns/locale/pt-BR` e labels em português.

O Dashboard usa colunas independentes alinhadas no topo: Saldo+métricas, Últimas transações e Insight IA. Os cards seguintes também usam altura natural. As métricas têm padding desktop menor. A lista de transações consulta no máximo 10 itens e tem limite/scroll somente no desktop, com cabeçalho fora da área rolável; mobile mantém seis itens visíveis. Categoria aproxima donut e legenda; parcelas mostram três planos; compromissos mostram dois por vencimento, mantendo totais; cartões exibem resumo compacto. Cards não esticam para a altura do vizinho.

`Compromissos do mês > Gerenciar` abre `CommitmentsDialog` no Dashboard. `CommitmentsManager` reúne cadastro, edição da ocorrência, status, confirmação e vínculo manual com despesa; a rota filha usa o mesmo componente como fallback. A ação de leitura e cada escrita verificam usuário no servidor. O vínculo exige despesa do mesmo mês e valor e não soma compromisso pago outra vez ao saldo. Modal e lista têm limites de altura e scroll interno.

Cartões usa duas colunas de cartões em telas largas com múltiplos registros, além do painel de resumo/parcelas. As ações do cabeçalho abrem formulários em Dialog. Com um cartão, cartão e painel dividem a área desktop. Nenhum formulário fica ocupando a página continuamente.

## Contrato dos campos

| Domínio | Componente | Valor exibido | Valor submetido |
| --- | --- | --- | --- |
| Moeda | `CurrencyInput` consolidado em `money-input.tsx` | `R$ 1.234,56` | `1234.56` via campo oculto para Server Actions; número para React Hook Form |
| Dia estrutural 1–31 | `DayOfMonthPicker` | `Dia 31`, grid 1–31 | inteiro `31` via campo oculto |
| Data completa | `DatePicker` + `Calendar` pt-BR | data por extenso em português | `Date` no React Hook Form; `yyyy-MM-dd` no compromisso |
| Mês financeiro | `MonthPicker` | `Setembro de 2026` | `2026-09` |
| Quantidade | input numérico | número de parcelas | inteiro 1–120 |

`CurrencyInput` reaproveita `Input`, aceita valor controlado, ref, disabled, erro e teclado numérico mobile. Os dígitos entram em centavos: `1` → `R$ 0,01`, `100` → `R$ 1,00`, `10000` → `R$ 100,00`. Backspace remove o último dígito, Delete limpa, selecionar tudo substitui, colar aceita dígitos ou valor brasileiro. Vazio é distinto de zero. O campo monetário de Transações foi consolidado nesse contrato; edição recebe o número original e já mostra a máscara. O banco continua em Prisma `Decimal`, com validação Zod de valor numérico finito e centavos; fatura permite zero, demais cadastros exigem valor positivo. Não há conversão de schema para centavos inteiros.

`DayOfMonthPicker` usa Popover, botões semânticos, `aria-pressed`, foco visível e seleção por mouse, Tab/Enter/Espaço. Fecha após selecionar e pode ser reaberto. Cartão usa o seletor para fechamento e vencimento. Compromisso avulso usa data completa. Compromisso recorrente usa primeiro mês e dia estrutural; ao materializar as 12 ocorrências, cada mês limita o dia ao último dia válido, preservando a escolha de 29–31 para meses seguintes durante a criação. A edição de um compromisso recorrente altera apenas a ocorrência atual, pois o schema guarda datas materializadas, sem entidade de série com o dia original. Em fevereiro, uma ocorrência já gravada no dia 28 não permite reconstruir se a escolha original foi 28, 29, 30 ou 31; alterar toda a série exigiria modelagem futura. Pagos conservam valor/data imutáveis no formulário.

Campos auditados: Adicionar/Editar transação (moeda e data), cartão (limite e dois dias), fatura (valor e mês), parcelamento (total, mensal, quantidade e mês), compromisso (valor, data ou dia recorrente), vínculo (seleção de despesa), Metas e Assinatura. Metas não expõe cadastro/edição de valores no estado atual; Assinatura apresenta preço, sem campo de preço editável. Importação lê arquivos e classifica linhas, sem editor monetário digitável. `installmentCount` permanece `type="number"` porque representa quantidade, não dinheiro ou dia do mês.

## Validação e pendências

Testes Node cobrem centavos, moeda pt-BR, zero/vazio, edição, números grandes, dias 1/31, alteração e rejeição de dias inválidos, além dos testes existentes de balanço, mês, navegação, webhooks e preservação da edição de transações importadas. A prévia visual local temporária foi removida após medir 1440, 1280, 768, 375 e 320 px no Dashboard, Cartões e modal. Não houve overflow horizontal; modais ficaram dentro da viewport. O seletor mudou para agosto via clique, atualizou `month=2026-08` e permaneceu após refresh. Entrada `10000` exibiu `R$ 100,00`; dia 31 por mouse e dia 1 por teclado foram selecionados, sem cadastro de dados de teste.

Persistência real e fluxo autenticado Clerk não foram exercitados pela prévia isolada. Conferir manualmente, com a sessão do usuário: cadastrar e editar transação preservando valor/data; cadastrar cartão com dias 1 e 31; lançar fatura zero e positiva; criar recorrência começando em fevereiro com dia 31 e verificar ocorrências de março; vincular despesa paga; navegar com mês histórico entre as rotas e abrir relatório Premium. A validação Mercado Pago segue pendente no ambiente real.
