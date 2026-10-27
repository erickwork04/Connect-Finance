# Processamento assíncrono

## Decisões

- **Relatório IA:** job persistido porque depende do Gemini e pode levar dezenas de segundos. A Server Action valida autenticação e Premium, grava a solicitação e devolve `jobId`; o processamento roda após a resposta e também pode ser retomado pelo worker.
- **Webhook Cakto:** valida assinatura e segredo antes de persistir jobs. O corpo nunca inclui o segredo recebido; cada pedido usa chave idempotente derivada do evento e do ID do pedido. A rota confirma com HTTP 202 depois de os jobs estarem gravados. O processador existente continua protegendo contra eventos Cakto repetidos.
- **Importações:** continuam síncronas porque a prévia interativa precisa retornar linhas para revisão. O limite fica explícito em 5 MB e 2.000 linhas; leitura, parse, busca de duplicatas e gravação registram duração e contagens sem guardar conteúdo financeiro nos logs. A confirmação usa gravações em lote.
- **Email:** não há integração de envio de email no projeto.
- **Demais operações:** consultas do dashboard e mutações pequenas permanecem na requisição porque são necessárias para renderizar/confirmar a ação e não chamam provedores externos demorados.

## Fila e estado

`BackgroundJob` é uma fila durável no PostgreSQL. Os estados são `QUEUED`, `RUNNING`, `SUCCEEDED` e `FAILED`; cada registro guarda progresso, tentativa, próxima execução, lease, resultado e código de erro. Resultados e falhas terminais expiram depois de 30 dias.

Jobs usam `idempotencyKey` única. O worker reivindica o job com uma atualização condicional, lease de 2 minutos e no máximo 3 tentativas. Falhas transitórias voltam para a fila com espera exponencial; falhas de payload/permissão tornam-se terminais. Um reenvio Cakto após falha terminal reabre o mesmo job pela chave idempotente; a chave dos eventos processados continua evitando efeitos duplicados. Logs estruturados incluem ID/tipo/tentativa/duração/código, nunca payload, email ou transações.

O worker também é acionado por `after()` após a resposta de uma Server Action ou webhook. Isso reduz a espera normal, mas não é a garantia de recuperação: um scheduler precisa chamar o endpoint do worker para drenar jobs pendentes e retentativas.

## Implantação

1. Aplicar a migration `20261014100000_background_jobs` primeiro em staging e depois no banco de produção conforme o processo de deploy. Ela cria somente a fila; não altera dados financeiros existentes.
2. Definir `CRON_SECRET` com pelo menos 32 bytes aleatórios em local e Vercel.
3. Configurar um scheduler para enviar `GET https://<domínio>/api/internal/jobs/worker` a cada minuto, com `Authorization: Bearer <CRON_SECRET>`. O endpoint processa um job por chamada e devolve `{ processed, jobId? }`.
4. O estado do relatório é consultado autenticadamente em `GET /api/jobs/<jobId>`. A API só retorna jobs do próprio usuário. Para observabilidade operacional dos jobs de webhook, `GET /api/internal/jobs/<jobId>` aceita o mesmo Bearer `CRON_SECRET` e retorna estado, progresso, tentativa e código de erro, sem expor o payload.

Não foi adicionado `vercel.json` com cron de um minuto porque esse intervalo depende do plano Vercel. Em 13/10/2026, Vercel permite intervalo de um minuto em Pro/Enterprise; Hobby limita crons a uma execução diária. Em Hobby, usar um scheduler externo com autenticação Bearer.

## Teste local do worker

Após migration em um banco local, definir `CRON_SECRET` e chamar o worker manualmente:

```powershell
Invoke-WebRequest -Headers @{ Authorization = "Bearer $env:CRON_SECRET" } `
  http://localhost:3000/api/internal/jobs/worker
```

Não apontar esse teste para a URL de produção. Jobs financeiros e resultados de IA podem conter informação privada.
