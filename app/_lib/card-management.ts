import type { Prisma } from "@prisma/client";

export type CreditCardChanges = {
  name: string;
  brand: string;
  limitTotal: number;
  closingDay: number;
  dueDay: number;
  isPrimary: boolean;
};

type CardTransaction = Pick<Prisma.TransactionClient, "creditCard">;

/** Editing an existing card never creates another card or consumes a plan slot. */
export async function updateOwnedCreditCard(
  tx: CardTransaction,
  ownerId: string,
  cardId: string,
  changes: CreditCardChanges,
): Promise<boolean> {
  const updated = await tx.creditCard.updateMany({
    where: { id: cardId, userId: ownerId, isActive: true },
    data: changes,
  });
  if (updated.count !== 1) return false;

  if (changes.isPrimary) {
    await tx.creditCard.updateMany({
      where: { userId: ownerId, isActive: true, id: { not: cardId } },
      data: { isPrimary: false },
    });
  }

  return true;
}

/** Archive instead of deleting so invoice/installment relations and history remain intact. */
export async function archiveOwnedCreditCard(
  tx: CardTransaction,
  ownerId: string,
  cardId: string,
): Promise<boolean> {
  const archived = await tx.creditCard.updateMany({
    where: { id: cardId, userId: ownerId, isActive: true },
    data: { isActive: false, isPrimary: false },
  });
  return archived.count === 1;
}
