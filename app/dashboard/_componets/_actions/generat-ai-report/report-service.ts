import { GoogleGenAI } from "@google/genai";
import { db } from "@/app/_lib/prisma";
import { getYearMonthRangeUtc } from "@/app/_lib/month-range";
import { getPlanPermissions } from "@/app/_lib/plan-permissions";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constanst/transactions";

const REPORT_TRANSACTION_SAMPLE_LIMIT = 200;

export async function generateAiReportForUser(userId: string, month: string, onGenerated?: (report: string) => Promise<void>): Promise<string> {
  const permissions = await getPlanPermissions(userId);
  if (!permissions.isPremium) throw Object.assign(new Error("Premium required"), { code: "SUBSCRIPTION_REQUIRED" });

  const [year, monthNumber] = month.split("-");
  const where = { userId, date: getYearMonthRangeUtc(month) };
  const [transactions, typeTotals, categoryTotals] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: REPORT_TRANSACTION_SAMPLE_LIMIT,
      select: { name: true, amount: true, type: true, category: true, date: true },
    }),
    db.transaction.groupBy({ where, by: ["type"], _sum: { amount: true }, _count: { _all: true } }),
    db.transaction.groupBy({ where: { ...where, type: "EXPENSE" }, by: ["category"], _sum: { amount: true } }),
  ]);
  const transactionCount = typeTotals.reduce((count, item) => count + item._count._all, 0);
  if (!transactionCount) {
    const report = `### Relatório Financeiro - Mês ${monthNumber}/${year}\n\nNenhuma transação foi registrada para este mês. Adicione receitas e despesas para receber insights detalhados.`;
    await onGenerated?.(report);
    return report;
  }

  const totals = { DEPOSIT: 0, EXPENSE: 0, INVESTMENT: 0 };
  for (const item of typeTotals) totals[item.type] = Number(item._sum.amount ?? 0);
  const topCategories = categoryTotals.sort((left, right) => Number(right._sum.amount ?? 0) - Number(left._sum.amount ?? 0)).slice(0, 8);
  const summary = [
    `Totais exatos do perÃ­odo: receitas R$ ${totals.DEPOSIT.toFixed(2)}, despesas R$ ${totals.EXPENSE.toFixed(2)}, investimentos R$ ${totals.INVESTMENT.toFixed(2)}.`,
    `TransaÃ§Ãµes no perÃ­odo: ${transactionCount}. Categorias de maior despesa: ${topCategories.map((item) => `${TRANSACTION_CATEGORY_LABELS[item.category]} R$ ${Number(item._sum.amount ?? 0).toFixed(2)}`).join("; ") || "nenhuma"}.`,
    `Amostra de atÃ© ${transactions.length} lanÃ§amentos recentes (de ${transactionCount} no total):`,
    ...transactions.map((transaction) =>
    `${transaction.date.toLocaleDateString("pt-BR")}-${transaction.name}-R$${transaction.amount}-${transaction.type}-${TRANSACTION_CATEGORY_LABELS[transaction.category]}`,
    ),
  ].join("\n");
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

  const expenses = topCategories.slice(0, 4)
    .map((item) => `- ${TRANSACTION_CATEGORY_LABELS[item.category]}: R$ ${Number(item._sum.amount ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n");
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
