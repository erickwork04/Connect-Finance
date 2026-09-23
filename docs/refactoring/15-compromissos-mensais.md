# Compromissos mensais em Transações

## Problema e decisão

Antes, `MonthlyCommitment` era a única entidade. A opção de cadastro repetia 12 linhas no banco e parava; cada linha tinha status próprio, mas não havia definição de recorrência para os meses seguintes. O gerenciamento ficava em um diálogo no Dashboard. Não havia exclusão. A edição de uma ocorrência permitia mudar o indicador `recurring` sem criar uma série, o que tornava o rótulo enganoso.

Agora Transações tem as abas **Transações** e **Compromissos**, preservando `month=YYYY-MM`. O Dashboard mostra apenas o resumo e o link **Gerenciar** abre a nova aba. A rota antiga `/dashboard/commitments` redireciona para ela. A UI reutiliza `CommitmentsManager` e os formulários existentes; não replica regras de negócio.

## Modelo e regras

- `RecurringCommitment` contém a definição mensal: dono, descrição, valor, categoria, dia original e primeiro mês. `endMonth` permite encerrar após um mês escolhido.
- `MonthlyCommitment` continua sendo a ocorrência, com valor, vencimento, status e eventual `transactionId` próprios. `recurrenceId` e `occurrenceMonth` ligam apenas as ocorrências novas à série. A chave única da dupla impede duas ocorrências da mesma série no mesmo mês, inclusive em leituras concorrentes.
- Ao consultar Dashboard ou Compromissos, somente os meses necessários são materializados. Um dia 29–31 é limitado ao último dia de um mês curto; o dia original permanece na definição e volta nos meses longos. A ocorrência começa `PENDING`.
- Confirmar um compromisso muda somente aquela ocorrência para `CONFIRMED`, sem registrar pagamento. Vincular manualmente uma despesa do mesmo usuário, mês e valor muda somente aquela ocorrência para `PAID`. Uma transação só pode estar vinculada a um compromisso; os saldos continuam calculados a partir de `Transaction` uma única vez.
- Editar altera somente a ocorrência exibida. O vencimento de uma ocorrência da série deve permanecer no mesmo mês. A definição dos meses seguintes não muda. Em ocorrência paga, valor e vencimento permanecem bloqueados.
- **Excluir deste mês** marca `deletedAt`, sem apagar a linha nem a transação vinculada. Uma transação já vinculada continua protegida contra edição/exclusão; o vínculo histórico permanece no banco. A ocorrência excluída não reaparece ao consultar o mês. **Encerrar recorrência** define o último mês e oculta ocorrências futuras pendentes; recusa a operação se houver mês futuro confirmado ou pago. Não há exclusão em cascata.
- Os 12 registros gerados por cadastros antigos permanecem intactos e independentes. Como não há identificador seguro de série nem dia original nesses registros, eles não foram agrupados automaticamente. São identificados na UI como “Mensal · cadastro anterior” e terminam após os 12 meses originalmente criados. A conversão assistida fica pendente.

## Banco

Auditoria antes da alteração: `prisma migrate status` mostrou as três migrations existentes aplicadas e schema sincronizado. Foram aplicadas duas migrations apenas aditivas:

1. `20260923120000_recurring_commitments`: cria `RecurringCommitment`, acrescenta `recurrenceId`, `occurrenceMonth` e `deletedAt` opcionais em `MonthlyCommitment`, índice único e FK com `RESTRICT`.
2. `20260923123000_recurring_commitment_end_month`: acrescenta `endMonth` opcional à definição.

Nenhuma linha existente foi modificada ou excluída pelas migrations. Não houve reset, `db push`, seed, alteração de credenciais ou nova exclusão em cascata. `prisma migrate deploy` aplicou ambas e `prisma migrate status` voltou a indicar schema atualizado. A divergência histórica de importação documentada em [auditoria Prisma](prisma-migration-audit.md) permanece.

## Arquivos principais

`prisma/schema.prisma`, as duas migrations acima, `app/_lib/commitments.ts`, `app/_lib/month-range.ts`, `app/_actions/dashboard-v2.ts`, `app/_data/get-dashboard/index.ts`, `app/_components/finance-forms.tsx`, `app/_components/commitments-manager.tsx`, `app/transactions/page.tsx`, `app/transactions/_components/transactions-header.tsx`, `app/transactions/_components/transactions-screen.tsx`, `app/dashboard/page.tsx`, `app/dashboard/_componets/dashboard-v2-cards.tsx` e `app/dashboard/commitments/page.tsx`. O diálogo antigo do Dashboard foi removido.

## Validação e pendências

- Testes automatizados: 30 passaram, incluindo vencimento nos dias 29–31 e ano bissexto. `npm run lint`, `npx tsc --noEmit`, `npm run build` com engine binária somente no processo, `prisma validate` e `prisma migrate status` passaram.
- A inspeção autenticada em desktop, tablet e mobile não pôde ser feita: o navegador automatizado bloqueou `http://localhost:3000` por não conseguir verificar uma política administrativa. É necessário conferir em sessão Clerk: criação mensal, mês seguinte pendente, pagamento de somente um mês, edição, exclusão de uma ocorrência, encerramento, vínculo manual, saldo sem dupla contagem e navegação entre abas mantendo `month`.
- Uma leitura direta opcional pelo Prisma Client não retornou em 60 segundos e foi interrompida; o comando `prisma migrate status` conectou e confirmou as cinco migrations aplicadas. Não houve escrita nessa leitura.
- A sugestão de vínculo na revisão de importação não faz parte desta etapa. Não há matching automático.
- Cadastros legados de 12 meses não são estendidos automaticamente. Uma migração de dados baseada apenas em descrição/valor/data poderia unir compromissos distintos e, por isso, não foi feita.
- A geração padrão do Prisma Client encontrou DLL local bloqueada (`EPERM`). O build usa `PRISMA_CLIENT_ENGINE_TYPE=binary` somente no processo; nenhuma variável de ambiente persistente foi alterada.
