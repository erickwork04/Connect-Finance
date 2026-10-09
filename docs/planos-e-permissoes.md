# Planos e permissões

## Planos

| Recurso | Connect Finance Free | Connect Finance Premium |
| --- | --- | --- |
| Preço | R$ 0,00 | R$ 19,90/mês |
| Dashboard, categorias e controle de saldo | Incluídos | Incluídos |
| Cadastro manual e histórico de transações | Ilimitados | Ilimitados |
| Cartões de crédito | 1 cartão ativo | Ilimitados |
| Compromissos financeiros ativos | Até 3 | Ilimitados |
| Parcelamentos e visualização por categoria | Incluídos | Incluídos |
| Importação de faturas, OFX e CSV | Não incluída | Incluída |
| Relatórios financeiros com IA | Não incluídos | Incluídos |

O limite de compromissos conta cada compromisso avulso não pago e não excluído uma vez, e cada recorrência não encerrada uma vez (inclusive as agendadas para começar no futuro, que reservam uma vaga). Ocorrências mensais de uma recorrência não consomem vagas adicionais. Compromissos pagos, excluídos e recorrências encerradas não contam.

## Fonte de verdade do Premium

O Clerk continua sendo a fonte de autorização. O acesso Premium existe somente quando `user.publicMetadata.subscriptionPlan === "premium"`. O módulo `app/_lib/plan-permissions.ts` lê essa metadata e `app/_lib/plan-rules.ts` centraliza os limites Free. O estado local do banco não concede acesso.

As permissões são reavaliadas no servidor nas Server Actions de processamento e confirmação de importação, criação de cartões, criação de compromissos e geração de relatórios com IA. A interface recebe as permissões calculadas no servidor para apresentar ou bloquear controles, mas as actions repetem a validação. A criação limitada de cartões e compromissos usa transações serializáveis para evitar que requisições simultâneas excedam o limite.

## Cancelamento, downgrade e recontratação

Quando o Clerk remove `subscriptionPlan: "premium"`, o usuário passa imediatamente a usar os limites Free. Os dados existentes não são apagados: cartões e compromissos acima do limite continuam visíveis, compromissos continuam disponíveis para edição e exclusão, mas novos cadastros ficam bloqueados até que haja espaço dentro do limite Free ou o Premium seja restaurado. Transações, histórico e dados importados são preservados. Novas importações e novos relatórios com IA ficam indisponíveis no Free. Quando o Clerk volta a indicar `premium`, os recursos são liberados automaticamente.

## Recursos futuros

Esta auditoria não encontrou implementação de exportação de relatórios. Também não encontrou uma área separada de análises financeiras avançadas além do dashboard e dos relatórios com IA existentes. Exportação e análises avançadas seguem como recursos previstos, não são apresentados como disponíveis e não foram criados nesta implementação. A consulta do histórico de transações permanece ilimitada no Free.
