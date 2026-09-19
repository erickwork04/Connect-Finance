# Segurança

- **NUNCA** exponha tokens, secrets, chaves ou credenciais em código, logs, documentação ou respostas.
- Não altere `.env` ou `.env.local` sem autorização.
- `.env.example` deve conter somente nomes de variáveis, sem valores secretos.
- Não logue payloads sensíveis completos.
- Erros enviados ao client não devem revelar detalhes internos desnecessários.