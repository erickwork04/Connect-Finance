# Etapa 5 — intervalos mensais

## Objetivo e alteração

O dashboard e a IA consultavam transações com início em `YYYY-MM-01` e limite exclusivo em `YYYY-MM-31`. Isso omitia o último dia de meses de 31 dias, o dia 30 dos demais meses e, em fevereiro, podia transbordar para março conforme o parser de datas. Ambos agora compartilham um intervalo UTC semiaberto `[primeiro dia do mês, primeiro dia do mês seguinte)`, com mês validado. A contagem de transações criadas para o plano gratuito conserva o fuso local usado anteriormente, mas usa o início do mês seguinte como limite exclusivo e captura a data atual uma única vez.

## Arquivos alterados

- `app/_lib/month-range.ts` e `app/_lib/month-range.test.mjs`
- `app/_data/get-dashboard/index.ts`
- `app/dashboard/_componets/_actions/generat-ai-report/index.ts`
- `app/_data/get-dashboard/get-current-month-transactions/index.ts`
- `docs/refactoring/monthly-date-ranges.md` e `phase-0-overview.md`

## Validação local

- 4 testes novos: fevereiro bissexto, fevereiro não bissexto/virada de dezembro, meses inválidos e limite final da franquia no fuso local; mais 3 testes existentes de assinatura de webhook — 7 passaram.
- `npm run lint` e `npm run build` passaram.

## Pendências e riscos

- A seleção continua restrita ao ano corrente, como antes. Ano e fuso horário do usuário não são modelados; o dashboard/IA seguem limites UTC legados, enquanto a franquia mensal segue o fuso local do servidor. Uma política de fuso do usuário é uma evolução separada.
- Não houve consulta ao banco real nem mudança de dados. **PENDENTE — validação com credenciais/ambiente real do Mercado Pago** permanece independente desta etapa.
