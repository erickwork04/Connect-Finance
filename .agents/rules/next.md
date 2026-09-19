# Next.js e Clerk

## Next.js
- Siga a versão atual do Next instalada no projeto.
- Antes de corrigir algo relacionado a `searchParams`, `params`, middleware ou navegação, considere as APIs da versão atual do Next.
- Não use redirects desnecessários em rotas de API/webhook.
- Webhooks devem responder diretamente com status HTTP apropriado.
- Não transforme páginas inteiras em Client Components apenas para resolver um problema localizado.
- Preserve separação entre Server Actions, Route Handlers e componentes de UI.

## Clerk / autenticação
- Rotas privadas devem continuar protegidas.
- Rotas públicas devem ser liberadas explicitamente.
- Webhooks de provedores externos não devem depender de usuário autenticado.
- Nunca exponha dados privados ou metadata sensível ao client sem necessidade.
- Mudanças em middleware devem ser avaliadas quanto a login, dashboard, APIs e webhooks.