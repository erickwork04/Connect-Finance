# Etapa 6 — auditoria das migrações Prisma

> Atualização do Dashboard V2 em 19/09/2026: esta auditoria inicial foi feita sem conexão. A inspeção posterior, somente leitura, do banco configurado mostrou que `ImportBatch`, `TransactionSource` e as colunas de importação já existem. `prisma migrate status` mostrou as duas migrations antigas aplicadas e somente `20260919222000_dashboard_v2_domains` pendente; o diff banco→schema continha apenas as novas entidades do Dashboard V2. Essa migration aditiva foi aplicada com sucesso, sem alterar dados existentes. O histórico incompleto de importação continua sendo um risco para a criação de um banco novo somente a partir das migrations locais. Consulte [Dashboard V2](11-dashboard-v2.md).

## Objetivo e método

Comparar `prisma/schema.prisma` com os arquivos SQL locais sem conectar ao PostgreSQL, ler credenciais ou aplicar migrações. O schema local é a fonte principal do modelo desejado; o estado real do banco permanece desconhecido.

## Achados

1. **ALTO — histórico incompleto:** as únicas migrações criam `Transaction` e adicionam `userId`. Não há migração para `ImportBatch`, enum `TransactionSource`, colunas `source`, `externalId`, `importHash`, `importBatchId`, índices de consulta/deduplicação ou chave estrangeira. Um banco criado só por `prisma migrate deploy` não atende ao código de importação atual. Um banco ajustado anteriormente com `db push` pode conter parte disso sem registro no histórico.
2. **ALTO — migração antiga condicionada aos dados:** `20241110113932_add_user_id_to_transaction` adiciona `userId TEXT NOT NULL` sem valor padrão. Se a tabela já tivesse linhas ao aplicá-la, falharia; o próprio SQL inclui esse aviso.
3. **ALTO — exclusão em cascata:** o modelo `Transaction.importBatch` usa `onDelete: Cascade`. Excluir um lote pode apagar transações financeiras. Nenhuma alteração de relação ou dados foi feita nesta auditoria.
4. **MÉDIO — deduplicação não imposta pelo banco:** `importHash` e `externalId` não têm índices únicos por usuário; verificações em código podem competir em importações simultâneas. Adicionar unicidade exige analisar registros existentes e semântica de transações repetidas antes de qualquer migração.

## Arquivos alterados

- `docs/refactoring/prisma-migration-audit.md`
- `docs/refactoring/phase-0-overview.md`

Nenhum arquivo Prisma ou dado foi alterado.

## Validação local

- `npx prisma validate --schema prisma/schema.prisma`: schema válido. Para evitar usar a URL real na validação estática, a variável `DATABASE_URL` foi substituída por um valor fictício **apenas no processo desse comando**; não houve conexão com banco ou alteração de `.env`.
- `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma`: confirmou enum, tabela, índices e chave estrangeira esperados pelo schema; comparação puramente estática, sem conexão.
- Leitura das duas migrações SQL e dos pontos de uso em importação. Lint e build da Etapa 5 passaram; esta etapa altera somente documentação.

## Pendências e riscos

- Antes de preparar/aplicar uma migração aditiva: inventariar `prisma migrate status`, estrutura real e histórico `_prisma_migrations` em ambiente autorizado, com backup e plano de recuperação; decidir como reconciliar eventual `db push`. Isso requer uma decisão operacional sobre dados reais e **não foi executado**.
- Validar cuidadosamente a política de exclusão do lote e a unicidade de importação antes de mudar constraints. Não aplicar `migrate reset`, `db push`, `migrate deploy` ou SQL em banco real automaticamente.
- **PENDENTE — validação com credenciais/ambiente real do Mercado Pago** permanece independente desta auditoria.
