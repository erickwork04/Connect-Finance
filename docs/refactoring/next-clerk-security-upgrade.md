# Etapa 7 — atualização de segurança Next/Clerk

## Objetivo e decisão

O projeto usava Next.js 14.2.35 e `@clerk/nextjs` 5.7.6. [Next.js 14 está fora do suporte](https://nextjs.org/support-policy), e a [atualização de segurança de agosto de 2026](https://nextjs.org/blog) recomenda 15.5.24 ou 16.3.3. Foi escolhida a linha 15.5.24 (Maintenance LTS) para reduzir as mudanças do framework. O [guia do Clerk v6](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/nextjs-v6) exige `auth()` assíncrono no middleware.

O [advisory do Clerk para `createRouteMatcher`](https://github.com/clerk/javascript/security/advisories/GHSA-vqx2-fgx2-5wq9) informa que a versão anterior 5.7.6 já continha a correção nessa linha; a nova 6.39.7 também supera a versão corrigida 6.39.2. A atualização do Clerk acompanha o Next 15 e não deve ser interpretada como prova de exploração no código anterior.

## O que foi feito

- Fixadas versões locais: Next.js e `eslint-config-next` 15.5.24; Clerk Next.js 6.39.7; React/React DOM 19.2.3 e tipos 19.3.0; `react-day-picker` 9.14.0; `next-themes` 0.4.6. `package-lock.json` foi atualizado pelo npm. Nenhuma outra dependência direta foi alterada intencionalmente.
- O middleware aguarda `auth()` e mantém exatamente a política anterior de rotas públicas e redirecionamento. As páginas privadas e Server Actions já tinham verificações próprias de `auth()`; o middleware permanece uma camada de experiência/defesa adicional. A [orientação recente do Clerk](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher) recomenda checagem por recurso em vez de depender exclusivamente de `createRouteMatcher()`.
- `app/dashboard/page.tsx` aguarda `searchParams`, conforme o [guia do Next 15](https://nextjs.org/docs/app/guides/upgrading/version-15).
- O calendário e o seletor de data foram adaptados às [mudanças de nomes de classes/componentes do DayPicker v9](https://daypicker.dev/v9/upgrading), preservando seleção e estilo pretendidos.
- O Next ajustou automaticamente `tsconfig.json` para `target: ES2017`; `next-env.d.ts` foi regenerado pela ferramenta com a referência de tipos de rota.

## Arquivos alterados

- `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`
- `middleware.ts`, `app/dashboard/page.tsx`
- `app/_components/ui/calendar.tsx`, `app/_components/ui/date-picker.tsx`
- `docs/refactoring/next-clerk-security-upgrade.md`, `docs/refactoring/phase-0-overview.md`, `docs/refactoring/webhook-public-routes.md`

## Testes locais

- Testes de intervalo mensal/franquia e assinatura HMAC: 7 passaram na validação final.
- `npm run lint`: passou sem erros/avisos ESLint; o comando `next lint` mostra aviso de depreciação para Next 16.
- `npm run build`: passou, inclusive tipos e geração de páginas, com Next 15.5.24.
- Em `next start` local: `/` e `/privacy` → 200; `/dashboard`, `/transactions` e `/subscription` sem sessão → 307 para `/login`; `GET` nos dois webhooks → 405, sem redirecionamento. Testes apenas de roteamento, sem webhook assinado ou chamada ao provedor.
- `npm audit --omit=dev`: a API de advisories do registro npm retornou 503 por manutenção; o resultado de vulnerabilidades não foi obtido. Repetir quando o serviço estiver disponível.

## Pendências e riscos

- Verificar manualmente login/logout real, acesso autenticado, atualização de metadata Premium e callbacks Stripe/Mercado Pago em ambiente apropriado. Nenhum fluxo de pagamento/IA foi exercitado com credenciais reais.
- Conferir visualmente o calendário e a seleção de data em transações após a atualização do DayPicker; compilação e testes de rota não verificam aparência/interação no navegador.
- `createRouteMatcher()` está depreciado pelo Clerk, mas foi mantido para preservar o comportamento do middleware. Os recursos privados conhecidos também usam `auth()`. Antes de uma futura remoção do matcher, auditar todos os recursos individualmente e preservar a experiência de redirecionamento.
- A compatibilidade de dependências transitivas e o alerta de depreciação `next lint` devem ser reavaliados antes de um futuro Next 16. A auditoria npm não pôde ser concluída por indisponibilidade do serviço.
- A divergência de migrações Prisma da Etapa 6 continua sem aplicação ao banco. **PENDENTE — validação com credenciais/ambiente real do Mercado Pago**.

## Escopo

Somente código e testes locais. Nenhuma operação Git, deploy, consulta à Vercel, acesso/alteração de `.env` ou `.env.local`, validação de credenciais ou conexão com banco.
