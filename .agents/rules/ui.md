# UI

- Preserve a identidade visual do Connect Finance:
  - fundo escuro;
  - verde como destaque;
  - cards escuros;
  - bordas discretas;
  - layout limpo.
- Antes de criar componente novo, verifique se já existe componente equivalente em `shadcn/ui` ou no projeto.
- Não adicione bibliotecas de UI sem necessidade.
- Não use dados fake em fluxos reais apenas para preencher layout.
- Preserve acessibilidade básica: labels, foco, botões semânticos e estados disabled/loading.

## Responsividade obrigatória

- Toda alteração de UI deve ser validada em desktop e mobile.
- Nenhuma tela pode ser considerada concluída sem verificar comportamento responsivo.
- Teste no mínimo:
  - desktop;
  - tablet;
  - mobile.
- Evite overflow horizontal.
- Tabelas devem ter estratégia responsiva apropriada:
  - scroll horizontal controlado;
  - versão em cards;
  - ou adaptação de colunas.
- Botões, inputs, dialogs e menus devem permanecer utilizáveis em telas pequenas.
- Navbar deve continuar funcional em mobile.
- Cards devem reorganizar corretamente em grids menores.
- Textos não devem ser cortados de forma indevida.
- Modais/dialogs devem respeitar largura e altura da viewport.
- Componentes interativos devem manter áreas de toque adequadas no mobile.
- Após alterações relevantes de UI, valide manualmente pelo menos uma viewport mobile e uma desktop.
- Se houver comportamento diferente entre desktop e mobile, ambos devem ser testados.

## Critério de conclusão de UI

- Uma tarefa de frontend só pode ser marcada como concluída quando:
  - desktop estiver funcional;
  - mobile estiver funcional;
  - não houver overflow inesperado;
  - navegação estiver acessível;
  - estados loading, disabled, empty e error estiverem tratados quando aplicável.
  - Dashboards desktop devem aproveitar adequadamente a largura disponível sem gerar grandes áreas vazias laterais.
  - A reorganização mobile deve ser definida explicitamente; não dependa apenas de reduzir dimensões do layout desktop.