/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PrismaClient,
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
} from "@prisma/client";

interface InMemoryTransaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: any;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

const INITIAL_TRANSACTIONS: InMemoryTransaction[] = [
  {
    id: "tx-1",
    name: "Salário Mensal",
    type: TransactionType.DEPOSIT,
    amount: 7500.0,
    category: TransactionCategory.SALARY,
    paymentMethod: TransactionPaymentMethod.BANK_TRANSFER,
    date: new Date(`${currentYear}-${currentMonth}-05T10:00:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-05T10:00:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-05T10:00:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-2",
    name: "Aluguel Apartamento",
    type: TransactionType.EXPENSE,
    amount: 2200.0,
    category: TransactionCategory.HOUSING,
    paymentMethod: TransactionPaymentMethod.PIX,
    date: new Date(`${currentYear}-${currentMonth}-02T14:30:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-02T14:30:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-02T14:30:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-3",
    name: "Supermercado Mensal",
    type: TransactionType.EXPENSE,
    amount: 850.5,
    category: TransactionCategory.FOOD,
    paymentMethod: TransactionPaymentMethod.CREDIT_CARD,
    date: new Date(`${currentYear}-${currentMonth}-04T18:20:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-04T18:20:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-04T18:20:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-4",
    name: "Aporte Tesouro Direto",
    type: TransactionType.INVESTMENT,
    amount: 1500.0,
    category: TransactionCategory.OTHER,
    paymentMethod: TransactionPaymentMethod.BANK_TRANSFER,
    date: new Date(`${currentYear}-${currentMonth}-06T09:15:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-06T09:15:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-06T09:15:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-5",
    name: "Conta de Luz & Água",
    type: TransactionType.EXPENSE,
    amount: 320.0,
    category: TransactionCategory.HOUSING,
    paymentMethod: TransactionPaymentMethod.BANK_SLIP,
    date: new Date(`${currentYear}-${currentMonth}-03T11:00:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-03T11:00:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-03T11:00:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-6",
    name: "Combustível",
    type: TransactionType.EXPENSE,
    amount: 240.0,
    category: TransactionCategory.TRANSPORTATION,
    paymentMethod: TransactionPaymentMethod.DEBIT_CARD,
    date: new Date(`${currentYear}-${currentMonth}-05T16:45:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-05T16:45:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-05T16:45:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-7",
    name: "Restaurante",
    type: TransactionType.EXPENSE,
    amount: 180.0,
    category: TransactionCategory.FOOD,
    paymentMethod: TransactionPaymentMethod.CREDIT_CARD,
    date: new Date(`${currentYear}-${currentMonth}-06T20:30:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-06T20:30:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-06T20:30:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-8",
    name: "Academia",
    type: TransactionType.EXPENSE,
    amount: 120.0,
    category: TransactionCategory.HEALTH,
    paymentMethod: TransactionPaymentMethod.CREDIT_CARD,
    date: new Date(`${currentYear}-${currentMonth}-01T08:00:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-01T08:00:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-01T08:00:00.000Z`),
    userId: "demo_user",
  },
  {
    id: "tx-9",
    name: "Curso Online",
    type: TransactionType.EXPENSE,
    amount: 199.9,
    category: TransactionCategory.EDUCATION,
    paymentMethod: TransactionPaymentMethod.CREDIT_CARD,
    date: new Date(`${currentYear}-${currentMonth}-03T15:10:00.000Z`),
    createdAt: new Date(`${currentYear}-${currentMonth}-03T15:10:00.000Z`),
    updatedAt: new Date(`${currentYear}-${currentMonth}-03T15:10:00.000Z`),
    userId: "demo_user",
  },
];

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var inMemoryTransactions: InMemoryTransaction[] | undefined;
}

if (!global.inMemoryTransactions) {
  global.inMemoryTransactions = [...INITIAL_TRANSACTIONS];
}

const memoryStore = {
  get transactions() {
    if (!global.inMemoryTransactions) {
      global.inMemoryTransactions = [...INITIAL_TRANSACTIONS];
    }
    return global.inMemoryTransactions;
  },
  set transactions(val: InMemoryTransaction[]) {
    global.inMemoryTransactions = val;
  },
};

const filterTransactions = (where?: any) => {
  let list = [...memoryStore.transactions];
  if (!where) return list;

  if (where.userId) {
    list = list.filter((t) => !t.userId || t.userId === where.userId || t.userId === "demo_user");
  }
  if (where.type) {
    list = list.filter((t) => t.type === where.type);
  }
  if (where.category) {
    list = list.filter((t) => t.category === where.category);
  }
  if (where.date) {
    if (where.date.gte) {
      const gteTime = new Date(where.date.gte).getTime();
      list = list.filter((t) => new Date(t.date).getTime() >= gteTime);
    }
    if (where.date.lt) {
      const ltTime = new Date(where.date.lt).getTime();
      list = list.filter((t) => new Date(t.date).getTime() < ltTime);
    }
    if (where.date.lte) {
      const lteTime = new Date(where.date.lte).getTime();
      list = list.filter((t) => new Date(t.date).getTime() <= lteTime);
    }
  }
  if (where.createdAt) {
    if (where.createdAt.gte) {
      const gteTime = new Date(where.createdAt.gte).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() >= gteTime);
    }
    if (where.createdAt.lt) {
      const ltTime = new Date(where.createdAt.lt).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() < ltTime);
    }
  }
  return list;
};

const mockTransaction = {
  findMany: async (args?: any) => {
    let list = filterTransactions(args?.where);
    if (args?.orderBy?.date) {
      const isDesc = args.orderBy.date === "desc";
      list.sort((a, b) =>
        isDesc
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }
    if (typeof args?.take === "number") {
      list = list.slice(0, args.take);
    }
    return list;
  },

  findUnique: async (args: { where: { id: string } }) => {
    return memoryStore.transactions.find((t) => t.id === args.where.id) || null;
  },

  create: async (args: { data: any }) => {
    const newTx: InMemoryTransaction = {
      id: args.data.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: args.data.name,
      type: args.data.type,
      amount: Number(args.data.amount),
      category: args.data.category,
      paymentMethod: args.data.paymentMethod,
      date: new Date(args.data.date || new Date()),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: args.data.userId || "demo_user",
    };
    memoryStore.transactions = [newTx, ...memoryStore.transactions];
    return newTx;
  },

  update: async (args: { where: { id: string }; data: any }) => {
    const idx = memoryStore.transactions.findIndex((t) => t.id === args.where.id);
    if (idx === -1) {
      throw new Error(`Transaction with ID ${args.where.id} not found`);
    }
    const current = memoryStore.transactions[idx];
    const updated: InMemoryTransaction = {
      ...current,
      ...args.data,
      amount: args.data.amount !== undefined ? Number(args.data.amount) : current.amount,
      date: args.data.date ? new Date(args.data.date) : current.date,
      updatedAt: new Date(),
    };
    const nextList = [...memoryStore.transactions];
    nextList[idx] = updated;
    memoryStore.transactions = nextList;
    return updated;
  },

  delete: async (args: { where: { id: string } }) => {
    const target = memoryStore.transactions.find((t) => t.id === args.where.id);
    memoryStore.transactions = memoryStore.transactions.filter((t) => t.id !== args.where.id);
    return target || { id: args.where.id };
  },

  count: async (args?: any) => {
    return filterTransactions(args?.where).length;
  },

  aggregate: async (args?: any) => {
    const list = filterTransactions(args?.where);
    const sum = list.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return {
      _sum: {
        amount: sum,
      },
    };
  },

  groupBy: async (args: { by: string[]; where?: any; _sum?: any }) => {
    const list = filterTransactions(args.where);
    const groupKey = args.by[0] || "category";
    const groups = new Map<string, number>();

    for (const item of list) {
      const key = (item as any)[groupKey] || "OTHER";
      const amt = Number(item.amount) || 0;
      groups.set(key, (groups.get(key) || 0) + amt);
    }

    const result: Array<{ [key: string]: any; _sum: { amount: number } }> = [];
    groups.forEach((amount, key) => {
      result.push({
        [groupKey]: key,
        _sum: {
          amount,
        },
      });
    });
    return result;
  },
};

let realPrisma: PrismaClient | null = null;
if (process.env.DATABASE_URL) {
  try {
    if (process.env.NODE_ENV === "production") {
      realPrisma = new PrismaClient();
    } else {
      if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
      }
      realPrisma = global.cachedPrisma;
    }
  } catch (e) {
    console.warn("[AI Studio] Database connection init failed, using mock data layer", e);
    realPrisma = null;
  }
}

export const db: any = new Proxy(mockTransaction, {
  get(_target, prop) {
    if (prop === "transaction") {
      if (realPrisma && process.env.DATABASE_URL) {
        return new Proxy(mockTransaction, {
          get(mockTarget, method) {
            return async (...args: any[]) => {
              try {
                return await (realPrisma as any).transaction[method](...args);
              } catch {
                console.warn(`[AI Studio] Real DB query failed for transaction.${String(method)}, falling back to in-memory store`);
                return await (mockTarget as any)[method](...args);
              }
            };
          },
        });
      }
      return mockTransaction;
    }
    return (mockTransaction as any)[prop];
  },
});
