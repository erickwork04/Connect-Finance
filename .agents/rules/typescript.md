# TypeScript

- **NUNCA** use `any` em props de componentes, funções, retornos ou variáveis, salvo quando uma biblioteca externa obrigar e isso estiver documentado.
- Prefira tipos explícitos e reutilize tipos já existentes no projeto.
- Use `unknown` em vez de `any` quando o tipo ainda não for conhecido.
- Evite casts com `as` sem necessidade real.
- Não use `@ts-ignore` ou `@ts-expect-error` sem justificativa documentada.
- Não duplique tipos que já existam no Prisma, Zod ou em arquivos de tipos do projeto.