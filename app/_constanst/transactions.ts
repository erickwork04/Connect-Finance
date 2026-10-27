import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  [TransactionPaymentMethod.CREDIT_CARD]: "credit-card.svg",
  [TransactionPaymentMethod.DEBIT_CARD]: "debit-card.svg",
  [TransactionPaymentMethod.BANK_TRANSFER]: "bank-transfer.svg",
  [TransactionPaymentMethod.BANK_SLIP]: "bank-slip.svg",
  [TransactionPaymentMethod.CASH]: "money.svg",
  [TransactionPaymentMethod.PIX]: "pix.svg",
  [TransactionPaymentMethod.OTHER]: "other.svg",
};

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  SALARY: "Salário",
  HOME: "Casa",
  NECESSITIES: "Necessidades",
  WATER: "Água",
  ELECTRICITY: "Luz",
  INTERNET: "Internet",
  FOOD: "Alimentação",
  TRANSPORTATION: "Uber/99/Transporte",
  GASOLINE: "Gasolina",
  MECHANICS: "Mecânica",
  HEALTH_PHARMACY: "Saúde/Farmácia",
  PSYCHOLOGIST: "Psicólogo",
  GYM: "Academia",
  EDUCATION: "Educação",
  DEVELOPMENT: "Desenvolvimento",
  IFOOD: "iFood",
  SUBSCRIPTIONS: "Assinaturas",
  CLOTHING: "Roupa",
  BEAUTY_SALON: "Beleza/Salão",
  LEISURE: "Lazer",
  ENTERTAINMENT: "Entretenimento",
  GIFTS: "Presentes",
  OCCASIONAL_EXPENSES: "Despesas Eventuais",
  OTHER: "Outros",
};

export const TRANSACTION_CATEGORY_COLORS: Record<TransactionCategory, string> = {
  SALARY: "#76cfa8",
  HOME: "#d89065",
  NECESSITIES: "#e76b6b",
  WATER: "#55b9e8",
  ELECTRICITY: "#f3cf4c",
  INTERNET: "#8c82e8",
  FOOD: "#f3a34c",
  TRANSPORTATION: "#5e9be9",
  GASOLINE: "#f59e0b",
  MECHANICS: "#a98772",
  HEALTH_PHARMACY: "#e77fa5",
  PSYCHOLOGIST: "#e58cc8",
  GYM: "#e36b76",
  EDUCATION: "#6fbd85",
  DEVELOPMENT: "#38bfa1",
  IFOOD: "#eb665b",
  SUBSCRIPTIONS: "#ac82e8",
  CLOTHING: "#d68c62",
  BEAUTY_SALON: "#ef86a8",
  LEISURE: "#56b9a8",
  ENTERTAINMENT: "#bb80e8",
  GIFTS: "#f08d55",
  OCCASIONAL_EXPENSES: "#a6adba",
  OTHER: "#b8a7bd",
};

export const TRANSACTION_PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: "Transaferência Bancária",
  BANK_SLIP: "Boleto Bancário",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  OTHER: "Outros",
  PIX: "Pix",
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TransactionType.EXPENSE,
    label: "Despesa",
  },
  {
    value: TransactionType.DEPOSIT,
    label: "Depósito",
  },
  {
    value: TransactionType.INVESTMENT,
    label: "Investimento",
  },
];

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  {
    value: TransactionPaymentMethod.BANK_TRANSFER,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_TRANSFER],
  },
  {
    value: TransactionPaymentMethod.BANK_SLIP,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_SLIP],
  },
  {
    value: TransactionPaymentMethod.CASH,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CASH],
  },
  {
    value: TransactionPaymentMethod.CREDIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CREDIT_CARD],
  },
  {
    value: TransactionPaymentMethod.DEBIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.DEBIT_CARD],
  },
  {
    value: TransactionPaymentMethod.OTHER,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.OTHER],
  },
  {
    value: TransactionPaymentMethod.PIX,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.PIX],
  },
];

export const TRANSACTION_CATEGORY_OPTIONS = [
  { value: TransactionCategory.SALARY, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.SALARY] },
  { value: TransactionCategory.HOME, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.HOME] },
  { value: TransactionCategory.NECESSITIES, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.NECESSITIES] },
  { value: TransactionCategory.WATER, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.WATER] },
  { value: TransactionCategory.ELECTRICITY, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.ELECTRICITY] },
  { value: TransactionCategory.INTERNET, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.INTERNET] },
  { value: TransactionCategory.FOOD, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.FOOD] },
  { value: TransactionCategory.TRANSPORTATION, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.TRANSPORTATION] },
  { value: TransactionCategory.GASOLINE, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.GASOLINE] },
  { value: TransactionCategory.MECHANICS, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.MECHANICS] },
  { value: TransactionCategory.HEALTH_PHARMACY, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.HEALTH_PHARMACY] },
  { value: TransactionCategory.PSYCHOLOGIST, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.PSYCHOLOGIST] },
  { value: TransactionCategory.GYM, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.GYM] },
  { value: TransactionCategory.EDUCATION, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.EDUCATION] },
  { value: TransactionCategory.DEVELOPMENT, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.DEVELOPMENT] },
  { value: TransactionCategory.IFOOD, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.IFOOD] },
  { value: TransactionCategory.SUBSCRIPTIONS, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.SUBSCRIPTIONS] },
  { value: TransactionCategory.CLOTHING, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.CLOTHING] },
  { value: TransactionCategory.BEAUTY_SALON, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.BEAUTY_SALON] },
  { value: TransactionCategory.LEISURE, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.LEISURE] },
  { value: TransactionCategory.ENTERTAINMENT, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.ENTERTAINMENT] },
  { value: TransactionCategory.GIFTS, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.GIFTS] },
  { value: TransactionCategory.OCCASIONAL_EXPENSES, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.OCCASIONAL_EXPENSES] },
  { value: TransactionCategory.OTHER, label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.OTHER] },
];
