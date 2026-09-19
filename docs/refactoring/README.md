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
| [06 — Transações UI](06-transacoes-ui.md) | Evolução visual | PENDENTE |
| [07 — Metas UI](07-metas-ui.md) | Tela e componentes; backend pendente | EM ANDAMENTO |
| [08 — Cartões UI](08-cartoes-ui.md) | Tela e componentes; backend pendente | EM ANDAMENTO |
| [09 — Assinatura UI](09-assinatura-ui.md) | Tela evoluída; gerenciamento/billing pendentes | EM ANDAMENTO |
| [10 — Componentes compartilhados](10-componentes-compartilhados.md) | Extração seletiva | CONCLUÍDO |
| [11 — Dashboard V2](11-dashboard-v2.md) | Período global, regras financeiras, novos domínios e validação | IMPLEMENTADO; validação autenticada pendente |

Status `EM ANDAMENTO` significa que a camada local foi implementada, mas a funcionalidade ainda depende de teste autenticado ou backend. Metas e Cartões não apresentam dados fictícios nem permitem cadastro até haver persistência. **PENDENTE — validação com credenciais/ambiente real do Mercado Pago** é independente das correções locais.

As regressões anteriores estão registradas em [01 — Regressões funcionais](01-regressoes-funcionais.md). Nesta evolução visual, 16 testes automatizados, `npm run lint`, `npx tsc --noEmit` e `npm run build` passaram. As rotas públicas retornaram 200 e Metas/Cartões/Assinatura sem sessão retornaram 307 para `/login`. A divergência de migrações continua somente documentada em [auditoria Prisma](prisma-migration-audit.md). O registro anterior de `EPERM` no build descreve uma execução passada; não ocorreu nesta validação.
