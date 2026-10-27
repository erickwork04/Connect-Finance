import { GoogleGenAI } from "@google/genai";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc } from "@/app/_lib/month-range";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";

export async function generateAiReportForUser(userId: string, month: string, onGenerated?: (report: string) => Promise<void>): Promise<string> {
  const permissions = await getPlanPermissions(userId);
  if (!permissions.isPremium) throw Object.assign(new Error("Premium required"), { code: "SUBSCRIPTION_REQUIRED" });

  const [year, monthNumber] = month.split("-");
  const transactions = await db.transaction.findMany({
    where: { userId, date: getYearMonthRangeUtc(month) },
    select: { name: true, amount: true, type: true, category: true, date: true },
  });
  if (!transactions.length) {
    const report = `### Relatório Financeiro - Mês ${monthNumber}/${year}\n\nNenhuma transação foi registrada para este mês. Adicione receitas e despesas para receber insights detalhados.`;
    await onGenerated?.(report);
    return report;
  }

  const summary = transactions.map((transaction) =>
    `${transaction.date.toLocaleDateString("pt-BR")}-${transaction.name}-R$${transaction.amount}-${transaction.type}-${TRANSACTION_CATEGORY_LABELS[transaction.category]}`,
  ).join(";");
  const prompt = `Você é um especialista em gestão e organização de finanças pessoais.

Gere um relatório completo com insights estruturados sobre as finanças do usuário, incluindo:
1. Resumo geral de entradas, saídas, investimentos e saldo.
2. Principais centros de custo e despesas que chamam atenção.
3. Pontos de melhoria e oportunidades de economia.
4. Recomendações práticas e acionáveis para o próximo mês.

Dados das transações do mês ({DATA}-{DESCRIÇÃO}-{VALOR}-{TIPO}-{CATEGORIA}):
${summary}

Formate em Markdown claro, elegante e profissional em português brasileiro.`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um especialista em gestão e organização de finanças pessoais. Responda em português brasileiro com recomendações analíticas e práticas.",
          httpOptions: { timeout: 45_000 },
        },
      });
      if (response.text) {
        await onGenerated?.(response.text);
        return response.text;
      }
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "GENERATION_ERROR";
      console.warn(JSON.stringify({ event: "ai_report_provider_fallback", code }));
    }
  }

  const totals = { DEPOSIT: 0, EXPENSE: 0, INVESTMENT: 0 };
  const categories: Record<string, number> = {};
  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    totals[transaction.type] += amount;
    if (transaction.type === "EXPENSE") categories[transaction.category] = (categories[transaction.category] ?? 0) + amount;
  }
  const expenses = Object.entries(categories).sort((left, right) => right[1] - left[1]).slice(0, 4)
    .map(([category, amount]) => `- ${TRANSACTION_CATEGORY_LABELS[category as keyof typeof TRANSACTION_CATEGORY_LABELS] ?? category}: R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n");
  const savingsRate = totals.DEPOSIT > 0 ? Math.round(((totals.DEPOSIT - totals.EXPENSE) / totals.DEPOSIT) * 100) : 0;
  const report = `### 📊 Relatório Financeiro Inteligente (${monthNumber}/${year})

#### 1. Resumo do mês

- **Receitas:** R$ ${totals.DEPOSIT.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Despesas:** R$ ${totals.EXPENSE.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Investimentos:** R$ ${totals.INVESTMENT.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Saldo líquido:** R$ ${(totals.DEPOSIT - totals.EXPENSE - totals.INVESTMENT).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Taxa de poupança:** ${savingsRate}%

#### 2. Maiores categorias de despesas

${expenses || "- Nenhuma despesa registrada."}

#### 3. Recomendações e próximos passos

1. Acompanhe despesas recorrentes de moradia e alimentação e compare o total com sua renda.
2. Planeje aportes para investimentos no início do mês, conforme seu orçamento.
3. Construa uma reserva de emergência compatível com seu custo de vida e objetivos.`;
  await onGenerated?.(report);
  return report;
}
