# 02 — Landing e autenticação

**Objetivo:** tornar o botão Entrar confiável com Next 15/Clerk 6 sem modificar middleware ou credenciais.

**Situação atual:** a landing é pública; ClerkProvider envolve a aplicação; middleware permite `/login` e protege páginas privadas. No navegador local, o modal antigo da landing abriu; a falha relatada não foi reproduzida nesse ambiente.

**Problemas encontrados:** o acesso por `/login` dependia de um `SignInButton` que saía para a página hospedada, e a landing dependia exclusivamente da abertura de modal.

**Alterações realizadas:** Entrar virou link para `/login`; a rota renderiza `<SignIn routing="hash" forceRedirectUrl="/dashboard" />`; usuário já autenticado segue para `/dashboard`.

**Arquivos envolvidos:** `app/(home)/page.tsx`, `app/login/page.tsx`; `middleware.ts` foi revisado sem mudança.

**Critérios de aceite:** clicar Entrar abre `/login` com formulário Clerk; `/dashboard` sem sessão redireciona; login real termina em `/dashboard` e logout preserva proteção. Os dois últimos requerem teste manual autenticado.

**Status:** EM ANDAMENTO — formulário e proteção local vistos no navegador; autenticação real pendente.
