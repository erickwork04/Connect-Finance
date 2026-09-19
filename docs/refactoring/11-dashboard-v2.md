# Dashboard V2 — arquitetura e validação

## Objetivo e auditoria

Implementar um painel financeiro amplo, responsivo e orientado pelo mês da URL. Antes da mudança foram revisados Dashboard, navbar, consultas mensais, transações e importação, categorias, Cartões, Metas, Assinatura, schema, duas migrations históricas e a documentação desta pasta. Cartões, parcelas e compromissos não tinham entidades persistentes; `paymentMethod=CREDIT_CARD` e `source=CARD_INVOICE` não identificavam cartão. As categorias eram um enum fixo sem cores. O relatório IA já era uma Server Action Premium.

## Arquitetura e período

- `month=YYYY-MM` é a fonte temporal nas rotas financeiras. `MonthSelector` fica na navbar e altera o parâmetro da rota atual. A navegação entre Dashboard, Transações, Cartões, Metas e Assinatura preserva o mês; a rota filha `/dashboard/commitments` permanece na aba Dashboard.
- Ao abrir o cadastro manual de transação em um mês histórico, a data inicial do formulário é o primeiro dia daquele mês; no mês atual, é hoje. O usuário ainda pode escolher outra data.
- Dashboard, Transações e Cartões canonicalizam `month`; relatório IA recebe o mesmo valor. O filtro `categoryPeriod` afeta somente Gastos por categoria: mês escolhido, três/seis meses até ele ou janeiro até ele.
- `getDashboard` consulta mês atual, imediatamente anterior, categorias, seis transações recentes e os novos domínios em paralelo. Valores decimais são convertidos para número apenas na apresentação; o banco continua usando `Decimal`.
- A página mantém autenticação Clerk no servidor. O relatório completo só é gerado sob clique e conserva a verificação Premium existente no servidor. O card gratuito mostra acesso Premium sem chamar IA.
- O grid desktop usa 12 colunas: Saldo, transações e insight no topo; métricas abaixo do Saldo; categorias/parcelas e cartão/compromissos nas linhas seguintes. Em mobile a ordem é Saldo, quatro métricas, insight, transações, categorias, parcelas, cartão, compromissos.

## Regras financeiras

- Saldo do mês = receitas `DEPOSIT` − despesas `EXPENSE` − investimentos `INVESTMENT`.
- Comparações usam sempre o mês selecionado e seu anterior imediato, inclusive na virada de ano. Base anterior zero ou não finita resulta em `—`, jamais `Infinity` ou `NaN`.
- Disponível após compromissos = saldo − valores de compromissos ainda não pagos e sem transação vinculada. `PENDING` e `CONFIRMED` continuam obrigações; `PAID` só ocorre após vínculo manual a uma despesa do mesmo usuário, mês e valor. O compromisso pago não entra novamente no saldo. Transações vinculadas ficam protegidas contra edição/exclusão que quebraria essa conciliação.
- Gastos fixos somam compromissos marcados recorrentes com vencimento no mês, pagos ou não. Não são inferidos por nome nem somados uma segunda vez a Despesas. Ao criar um recorrente, são lançadas 12 ocorrências mensais, com o dia limitado ao último dia do mês quando necessário.
- Plano de parcelamento é um acompanhamento de compra: parcela atual = meses desde o início + 1; progresso = parcela atual / quantidade; após a última parcela deixa de aparecer no bloco ativo. O plano não gera uma despesa nem uma fatura automaticamente.
- Limite utilizado do cartão = soma das faturas abertas cadastradas nele; disponível = total − utilizado; percentual = utilizado / total × 100, com proteção para total zero. Fatura atual e próxima usam o mês selecionado e o seguinte. Não se presume cartão nem fatura a partir de importações.

## Componentes e categorias

- `dashboard-v2-cards.tsx`: saldo, quatro métricas, últimas transações, Insight IA, parcelamentos, cartão e compromissos.
- Cards, seletor mensal e gráficos antigos do Dashboard foram removidos após substituir seus usos; `PageHeader`, navbar, botão de transação, estados vazios e componentes `shadcn/ui` continuam reutilizados.
- `category-expenses-card.tsx` e `category-filter.tsx`: donut, total central, legenda com valor/percentual e filtro local.
- `month-selector.tsx`: seletor global na navbar; `finance-forms.tsx`: formulários de cartões, faturas, planos, compromissos e vínculo manual.
- A paleta central `TRANSACTION_CATEGORY_COLORS` acompanha o enum existente e é aplicada ao Dashboard e à tabela de Transações: Moradia vermelho, Alimentação laranja, Transporte azul, Entretenimento roxo, Saúde rosa, Educação verde, Salário verde claro e Outros lilás acinzentado. O enum atual não possui categorias separadas para Assinaturas ou Investimentos; não foram inventadas nem migradas categorias antigas.

## Prisma e banco

- Migration aditiva `20260919222000_dashboard_v2_domains` cria `CreditCard`, `CardInvoice`, `InstallmentPlan`, `MonthlyCommitment` e três enums de status. Inclui índices, checks de valores/dias e referências `ON DELETE RESTRICT`. Nenhuma coluna ou registro existente foi alterado/excluído. Cores ficam centralizadas por enum, sem tabela de categorias ou migration de cor desnecessária.
- Antes de aplicar: `prisma migrate status` mostrou somente a nova migration pendente. Introspecção somente leitura mostrou `ImportBatch`, `TransactionSource` e colunas de importação já presentes. `prisma migrate diff` do banco real para o schema desejado mostrou exclusivamente os novos tipos, tabelas, índices e relações. Assim, a divergência histórica de importação não gerou operação inesperada nesta aplicação.
- `npx prisma migrate deploy` aplicou a migration; `npx prisma migrate status` retornou banco atualizado e o diff posterior banco→schema não encontrou diferenças. A divergência histórica continua relevante para um banco novo construído apenas pelas migrations antigas; deverá ser reconciliada em trabalho separado antes desse cenário.
- `prisma validate` passou. `prisma generate` com engine local falhou por `EPERM` ao renomear DLL bloqueada por outro processo; nenhum processo existente foi encerrado. `prisma generate --no-engine` gerou tipos e consulta somente leitura confirmou acesso à nova tabela. `npm run build` falhou apenas nessa etapa de geração; `npx next build` concluiu com sucesso.

## Testes, aceite e limites

- 17 testes Node passaram, incluindo balanço, comparação sem base, virada de ano, limite do cartão, navegação e integridade da edição de transações importadas. `npm run lint`, `npx tsc --noEmit`, `npx next build` e `prisma validate` passaram.
- Prévia local temporária com dados de teste foi usada apenas para inspeção visual e removida, junto com sua exceção temporária no middleware. Em 1440, 1280, 768, 375 e 320 px, não houve overflow horizontal; a ordem mobile e o donut foram inspecionados. Em 320 px valores dos cards foram ajustados para caberem sem quebra. Menu mobile mostrou links com `month`; troca do seletor e reload preservaram o mês.
- A inspeção autenticada com dados reais ainda precisa ser feita pelo usuário, pois a prévia local acessível ao agente não tinha sessão Clerk. Validar também criação de cartão/fatura/parcelamento, compromisso recorrente, vínculo a transação importada/manual e comparação em dois meses com dados reais. A prévia não testa persistência de formulários.
- Recorrência é materializada em 12 meses no cadastro; não existe renovação automática após esse horizonte, nem edição/cancelamento em série. Faturas e planos são lançamentos explícitos, sem conciliação automática com importações. Esta escolha evita matching agressivo e duplo impacto financeiro.
- A interface trata `P2021` das novas tabelas como indisponibilidade durante rollout; outras falhas de consulta continuam propagadas. A classificação Premium e webhooks foram preservados.
- **PENDENTE — validação com credenciais/ambiente real do Mercado Pago.** Não houve homologação ou deploy nesta tarefa.
