"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

// import OpenAI from "openai";

import { GoogleGenAI } from "@google/genai";
import { GenerateAiReportSchema, generateAiReportSchema } from "./schema";
import { Transaction } from "@prisma/client";

type GenerateAiReportResult =
  | {
      success: true;
      report: string;
    }
  | {
      success: false;
      code:
        | "UNAUTHORIZED"
        | "SUBSCRIPTION_REQUIRED"
        | "INVALID_DATA"
        | "GENERATION_ERROR";
      message: string;
    };

export const generateAiReport = async ({
  month,
}: GenerateAiReportSchema): Promise<GenerateAiReportResult> => {
  try {
    const validation = generateAiReportSchema.safeParse({ month });

    if (!validation.success) {
      return {
        success: false,
        code: "INVALID_DATA",
        message: "O mês informado é inválido.",
      };
    }

    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        code: "UNAUTHORIZED",
        message: "Sua sessão expirou. Entre novamente para continuar.",
      };
    }

    const client = await clerkClient();

    const user = await client.users.getUser(userId);

    const hasPremiumPlan =
      user.publicMetadata?.subscriptionPlan === "premium";

    if (!hasPremiumPlan) {
      return {
        success: false,
        code: "SUBSCRIPTION_REQUIRED",
        message:
          "Você não possui o plano Premium. Assine agora para gerar relatórios com IA.",
      };
    }

    const currentYear = new Date().getFullYear();

    const transactions: Transaction[] = await db.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(`${currentYear}-${month}-01`),
          lt: new Date(`${currentYear}-${month}-31`),
        },
      },
    });

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        report: `### Relatório Financeiro - Mês ${month}/${currentYear}

Nenhuma transação foi registrada para este mês até o momento. Comece adicionando seus ganhos e gastos no botão **+ Nova Transação** para gerar insights detalhados sobre sua saúde financeira!`,
      };
    }

    const transactionsSummary = transactions
      .map(
        (transaction: Transaction) =>
          `${new Date(transaction.date).toLocaleDateString("pt-BR")}-R$${transaction.amount}-${transaction.type}-${transaction.category}`,
      )
      .join(";");

    const prompt = `Você é um especialista em gestão e organização de finanças pessoais.

    Gere um relatório completo com insights estruturados sobre as finanças do usuário, incluindo:

    1. Resumo Geral (Entradas, Saídas e Saldo)

    2. Principais centros de custo e despesas que chamam atenção

    3. Pontos de melhoria e oportunidades de economia

    4. Recomendações práticas e acionáveis para o próximo mês

    Estrutura das transações do mês ({DATA}-{TIPO}-{VALOR}-{CATEGORIA}):

    ${transactionsSummary}

    Formate sua resposta em Markdown claro, elegante e profissional em português brasileiro.`;

    // 1. Gemini AI (Provedor de IA oficial)

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",

          contents: prompt,

          config: {
            systemInstruction:
              "Você é um especialista em gestão e organização de finanças pessoais. Você ajuda as pessoas a organizarem melhor as suas finanças de forma analítica e prática.",
          },
        });

        if (response.text) {
          return {
            success: true,
            report: response.text,
          };
        }
      } catch (geminiError) {
        console.warn(
          "[AI Studio] Gemini report generation failed:",
          geminiError,
        );
      }
    }

    /*
    // 2. OpenAI (Comentado a pedido do usuário - substituído pelo Gemini)

    // const openAiKey =
    //   process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

    // if (openAiKey) {
    //   try {
    //     const openAi = new OpenAI({ apiKey: openAiKey });

    //     const completion = await openAi.chat.completions.create({
    //       model: "gpt-4o-mini",

    //       messages: [
    //         {
    //           role: "system",
    //           content:
    //             "Você é um especialista em gestão e organização de finanças pessoais. Você ajuda as pessoas a organizarem melhor as suas finanças.",
    //         },

    //         {
    //           role: "user",
    //           content: prompt,
    //         },
    //       ],
    //     });

    //     if (completion.choices[0]?.message?.content) {
    //       return {
    //         success: true,
    //         report: completion.choices[0].message.content,
    //       };
    //     }
    //   } catch (openAiError) {
    //     console.warn(
    //       "[AI Studio] OpenAI report generation failed:",
    //       openAiError,
    //     );
    //   }
    // }
    */

    // 3. Fallback: Analytical report calculated from actual transaction data

    let deposits = 0;

    let expenses = 0;

    let investments = 0;

    const categories: Record<string, number> = {};

    transactions.forEach((t: Transaction) => {
      const amt = Number(t.amount) || 0;

      if (t.type === "DEPOSIT") deposits += amt;
      else if (t.type === "EXPENSE") {
        expenses += amt;

        categories[t.category] =
          (categories[t.category] || 0) + amt;
      } else if (t.type === "INVESTMENT") investments += amt;
    });

    const balance = deposits - expenses - investments;

    const savingsRate =
      deposits > 0
        ? Math.round(((deposits - expenses) / deposits) * 100)
        : 0;

    const topCategories = Object.entries(categories).sort(
      (a, b) => b[1] - a[1],
    );

    const fallbackReport = `### 📊 Relatório Financeiro Inteligente (${month}/${currentYear})

#### 1. Resumo do Mês

- **Receitas (Depósitos):** R$ ${deposits.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}

- **Despesas:** R$ ${expenses.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}

- **Investimentos:** R$ ${investments.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}

- **Saldo Líquido:** R$ ${balance.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}

- **Taxa de Poupança:** ${savingsRate}%

#### 2. Distribuição das Maiores Despesas

${topCategories
  .slice(0, 4)
  .map(
    ([cat, val]) =>
      `- **${cat}:** R$ ${val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} (${Math.round(
        (val / (expenses || 1)) * 100,
      )}% dos gastos)`,
  )
  .join("\n")}

#### 3. Recomendações e Próximos Passos

1. **Controle de Despesas Fixas:** Monitore as despesas de moradia e alimentação para mantê-las em até 50% da sua renda.

2. **Aporte Recorrente:** Busque reservar ao menos 15% a 20% das suas receitas líquidas no início do mês diretamente para investimentos.

3. **Reserva de Emergência:** Caso ainda não possua, garanta de 3 a 6 meses do seu custo de vida alocados em liquidez diária.`;

    return {
      success: true,
      report: fallbackReport,
    };
  } catch (error) {
    console.error("[AI Report] Unexpected error:", error);

    return {
      success: false,
      code: "GENERATION_ERROR",
      message:
        "Não foi possível gerar o relatório agora. Tente novamente em alguns instantes.",
    };
  }
};