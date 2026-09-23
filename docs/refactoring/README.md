# Refatoração local — índice

Este índice organiza o trabalho atual. Os documentos antigos da Fase 0 foram preservados como histórico; o código local é a fonte principal quando houver divergência. O Dashboard V2 incluiu migration aditiva aplicada após auditoria do banco. Não houve operação Git, deploy ou validação de credenciais do Mercado Pago.

| Documento | Assunto | Status |
| --- | --- | --- |
| [00 — Plano geral](00-plano-geral.md) | Sequência e limites | CONCLUÍDO |
| [01 — Regressões funcionais](01-regressoes-funcionais.md) | Diagnóstico e verificação | EM ANDAMENTO |
| [02 — Landing/Auth](02-landing-auth.md) | Entrada e Clerk | EM ANDAMENTO |
| [03 — Transações/edição](03-transacoes-edicao.md) | Valor, data e serialização | EM ANDAMENTO |
| [04 — Dashboard/navegação/filtros](04-dashboard-navegacao-filtros.md) | Mês e aba ativa | EM ANDAMENTO |
| [05 — Dashboard UI](05-dashboard-ui.md) | Evolução visual | PENDENTE |
| [06 — Transações UI](06-transacoes-ui.md) | Grade, filtros locais, tabela/cartões e análise do período | IMPLEMENTADO; validação autenticada pendente |
| [07 — Metas UI](07-metas-ui.md) | Tela e componentes; backend pendente | EM ANDAMENTO |
| [08 — Cartões UI](08-cartoes-ui.md) | Tela e componentes; backend pendente | EM ANDAMENTO |
| [09 — Assinatura UI](09-assinatura-ui.md) | Tela evoluída; gerenciamento/billing pendentes | EM ANDAMENTO |
| [10 — Componentes compartilhados](10-componentes-compartilhados.md) | Extração seletiva | CONCLUÍDO |
| [11 — Dashboard V2](11-dashboard-v2.md) | Período global, regras financeiras, novos domínios e validação | IMPLEMENTADO; validação autenticada pendente |
| [12 — Refino desktop e formulários](12-refino-desktop-formularios.md) | Densidade visual, modais, moeda, datas e dias | IMPLEMENTADO; validação autenticada pendente |
| [13 — Dashboard: realizado e previsto](13-dashboard-realizado-previsto.md) | Três números principais e compromissos separados | IMPLEMENTADO; validação visual autenticada pendente |
| [14 — Dashboard: composição visual](14-dashboard-composicao-visual.md) | Grade, superfícies especiais e lista recente | IMPLEMENTADO; validação visual autenticada pendente |
| [15 — Compromissos mensais](15-compromissos-mensais.md) | Aba em Transações, recorrência mensal e migrations aditivas | IMPLEMENTADO; validação autenticada pendente |

Status `EM ANDAMENTO` significa que a camada local foi implementada, mas a funcionalidade ainda depende de teste autenticado ou backend. Metas não apresenta dados fictícios; Cartões possui cadastro persistente desde o Dashboard V2. **PENDENTE — validação com credenciais/ambiente real do Mercado Pago** é independente das correções locais.

As regressões anteriores estão registradas em [01 — Regressões funcionais](01-regressoes-funcionais.md). Na composição visual mais recente do Dashboard, 29 testes automatizados, `npm run lint`, `npx tsc --noEmit` e `npx next build` passaram. `npm run build` parou na geração do Prisma por bloqueio local da DLL (`EPERM`); não houve mudança de schema nem migration. A divergência histórica de migrações está em [auditoria Prisma](prisma-migration-audit.md). A inspeção visual autenticada permanece pendente por bloqueio do navegador automatizado no servidor local.

A etapa 15 posterior introduziu duas migrations aditivas de recorrência mensal e conseguiu executar `npm run build` com engine binária configurada somente no processo. Os resultados atuais e as limitações estão em [Compromissos mensais](15-compromissos-mensais.md); o parágrafo anterior descreve a etapa 14.
