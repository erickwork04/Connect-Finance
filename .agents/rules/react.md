## React

**NUNCA** use any nas props de um componente.

- Não crie componentes gigantes. Extraia componentes quando houver responsabilidade claramente separada.
- Não extraia componentes pequenos sem ganho real de reutilização ou legibilidade.
- Prefira Server Components por padrão.
- Use `"use client"` somente quando houver necessidade de estado, efeitos, eventos, hooks de navegação ou APIs do navegador.
- Evite `useEffect` quando a mesma lógica puder ser resolvida por props, derivação de estado ou Server Components.
- Não armazene em state valores que podem ser derivados de outros estados ou props.
- Preserve responsividade desktop e mobile.