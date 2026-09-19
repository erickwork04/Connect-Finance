# Prisma e banco de dados

- **NUNCA** execute `prisma migrate`, `prisma db push`, `prisma migrate reset`, seed ou alterações destrutivas no banco sem autorização explícita.
- Não altere schema ou relações do Prisma apenas para corrigir problema de frontend.
- Antes de mudar models, verifique impactos em dados existentes.
- Preserve valores monetários e conversões entre reais e centavos.
- Não introduza cascade delete sem avaliação explícita de impacto.