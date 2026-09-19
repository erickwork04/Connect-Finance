# 01 — Regressões funcionais

**Objetivo:** corrigir os fluxos de entrada, edição, navegação e filtro mensal quebrados após o upgrade.

**Situação atual:** correções locais implementadas. A landing já abria modal no navegador local antes da correção, então a falha original não foi reproduzida; `/login` enviava ao Clerk hospedado em vez de renderizar o formulário local.

**Problemas encontrados:** `TimeSelect` usava `defaultValue` e enviava para `/`; `getDashboard` combinava mês da URL com ano corrente; navbar tratava `/` como Dashboard; `MoneyInput` ignorava o valor do formulário e a data chegava serializada como string.

**Alterações realizadas:** rota de login direta, `SignIn` embutido, DTO tipado, `MoneyInput` controlado, data convertida, mês canônico com intervalo semiaberto UTC, navegação centralizada e botão do date-picker sem submit implícito.

**Arquivos envolvidos:** páginas `/`, `/login`, `/dashboard`, `/transactions`; `navbar.tsx`, `time-select.tsx`, `upsert-transaction-dialog.tsx`, `date-picker.tsx`, helpers e testes.

**Critérios de aceite:** página pública abre; `/login` exibe formulário; páginas privadas negam acesso sem sessão; valores manuais/importados e mês/ano persistem; testes, lint, build e validação estática do Prisma passam. Salvar transação e navegar autenticado exigem teste manual com conta apropriada.

**Status:** EM ANDAMENTO — validação autenticada pendente; nenhuma credencial foi consultada.

**Validação local:** 15 testes automatizados passaram (intervalos, navegação, conversão de quatro origens e assinatura HMAC); `npm run lint` passou; `npx next build` passou; `npx prisma validate --schema prisma/schema.prisma` passou com URL fictícia restrita ao processo, sem conexão. Em produção local, `/`, `/privacy`, `/login` retornaram 200 e as três rotas privadas redirecionaram a `/login` sem sessão. O script `npm run build` foi tentado duas vezes, mas `prisma generate` falhou com `EPERM` ao substituir a DLL do cliente enquanto outra instância local do projeto permanecia ativa na porta 3000; essa instância não foi encerrada. O build Next isolado compilou, verificou tipos e gerou as rotas com sucesso.
