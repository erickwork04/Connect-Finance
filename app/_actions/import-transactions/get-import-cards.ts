"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

const IMPORT_CARD_LIMIT = 100;

export async function getImportCardOptions() {
  const { userId } = await auth();
  if (!userId) return { success: false as const, cards: [], hasMore: false };

  try {
    const cards = await db.creditCard.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      take: IMPORT_CARD_LIMIT + 1,
    });

    return {
      success: true as const,
      cards: cards.slice(0, IMPORT_CARD_LIMIT),
      hasMore: cards.length > IMPORT_CARD_LIMIT,
    };
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
    console.error(JSON.stringify({ event: "import_card_options_failed", code }));
    return { success: false as const, cards: [], hasMore: false };
  }
}
