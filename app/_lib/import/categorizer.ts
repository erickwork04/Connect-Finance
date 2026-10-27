import { TransactionCategory } from "@prisma/client";

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
}

// More specific categories come first so merchant names do not fall into a broad rule.
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: TransactionCategory.SALARY,
    keywords: ["salario", "folha de pagamento", "remuneracao", "pro-labore", "pro labore", "rendimento", "ted recebida", "pix recebido salario", "ordenado", "honorarios", "adiantamento salarial", "beneficio", "inss", "13o", "decimo terceiro", "estagio", "bolsa auxilio"],
  },
  {
    category: TransactionCategory.HOME,
    keywords: ["aluguel", "condominio", "iptu", "imobiliaria", "gas", "casa", "leroy merlin", "telhanorte", "moveis", "reforma", "limpeza", "diarista", "material de limpeza", "produto de limpeza"],
  },
  {
    category: TransactionCategory.WATER,
    keywords: ["agua", "sabesp", "sanepar", "copasa", "saae", "caesb", "embasa", "corsan", "dmae", "cagepa", "cesan", "sanasa"],
  },
  {
    category: TransactionCategory.ELECTRICITY,
    keywords: ["luz", "energia", "enel", "copel", "cemig", "cpfl", "eletropaulo", "neoenergia", "energisa", "celesc", "equatorial", "light", "edp", "rge"],
  },
  {
    category: TransactionCategory.INTERNET,
    keywords: ["internet", "banda larga", "fibra", "Brisanet" , "provedor", "oi fibra", "claro", "vivo", "tim"],
  },
  {
    category: TransactionCategory.MECHANICS,
    keywords: ["oficina", "mecanic", "pneu", "autopecas", "auto pecas", "funilaria", "borracharia", "revisao do carro", "manutencao do carro", "troca de oleo"],
  },
  {
    category: TransactionCategory.GASOLINE,
    keywords: ["gasolina", "combustivel", "etanol", "posto", "shell", "ipiranga", "petrobras", "ale combustiveis", "abastecimento"],
  },
  {
    category: TransactionCategory.TRANSPORTATION,
    keywords: ["uber", "99", "99app", "99pop", "99taxi", "cabify", "indrive", "transporte", "sem parar", "veloe", "conectcar", "estacionamento", "pedagio", "metro", "cptm", "onibus", "passagem", "latam", "gol", "azul", "rentcars", "localiza", "movida"],
  },
  {
    category: TransactionCategory.IFOOD,
    keywords: ["ifood"],
  },
  {
    category: TransactionCategory.FOOD,
    keywords: ["rappi", "ze delivery", "restaurante", "lanchonete", "mcdonald", "mc donald", "burger king", "subway", "padaria", "panificadora", "pizzaria", "bar", "churrascaria", "supermercado", "mercado", "carrefour", "extra", "pao de acucar", "assai", "atacadao", "hortifruti", "acougue", "cafe", "coffee", "starbucks", "sorveteria", "cantina", "bistro", "hamburguer", "delivery", "comida", "alimento", "mercearia", "sacolao", "chocolat", "doceria", "emporio", "sushi"],
  },
  {
    category: TransactionCategory.PSYCHOLOGIST,
    keywords: ["psicolog", "terapia", "psicoterap", "psiquiatra"],
  },
  {
    category: TransactionCategory.GYM,
    keywords: ["academia", "smart fit", "bluefit", "bodytech", "gympass", "wellhub", "totalpass", "crossfit"],
  },
  {
    category: TransactionCategory.HEALTH_PHARMACY,
    keywords: ["farmacia", "drogaria", "drogasil", "raia", "pacheco", "panvel", "hospital", "clinica", "medico", "consulta", "dentista", "odonto", "laboratorio", "exame", "unimed", "bradesco saude", "sulamerica", "notredame", "hapvida", "amil", "fisioterapia", "oftalmo", "otica", "remedio", "medicamento"],
  },
  {
    category: TransactionCategory.BEAUTY_SALON,
    keywords: ["salao", "barbearia", "cabeleireiro", "manicure", "pedicure", "estetica", "depilacao", "cosmetico"],
  },
  {
    category: TransactionCategory.CLOTHING,
    keywords: ["roupa", "vestuario", "renner", "riachuelo", "c&a", "zara", "shein", "centauro", "calcado", "tenis", "sapato"],
  },
  {
    category: TransactionCategory.SUBSCRIPTIONS,
    keywords: ["netflix", "spotify", "amazon prime", "prime video", "disney", "hbo", "max", "youtube premium", "deezer", "apple music", "apple.com/bill", "google one", "globoplay", "globo play", "paramount", "crunchyroll", "assinatura", "mensalidade de aplicativo"],
  },
  {
    category: TransactionCategory.ENTERTAINMENT,
    keywords: ["cinema", "cinemark", "cinepolis", "ingresso", "steam", "playstation", "psn", "xbox", "twitch", "show", "teatro", "jogos", "evento", "sympla", "eventim"],
  },
  {
    category: TransactionCategory.LEISURE,
    keywords: ["viagem", "hotel", "pousada", "resort", "parque", "museu", "passeio", "turismo", "praia", "cruzeiro", "parque aquatico"],
  },
  {
    category: TransactionCategory.GIFTS,
    keywords: ["presente", "gift", "lembranca"],
  },
  {
    category: TransactionCategory.DEVELOPMENT,
    keywords: ["udemy", "alura", "coursera", "linkedin learning", "pluralsight", "certificacao", "desenvolvimento profissional", "curso profissional"],
  },
  {
    category: TransactionCategory.EDUCATION,
    keywords: ["escola", "colegio", "faculdade", "universidade", "curso", "livro", "livraria", "mensalidade escolar", "idiomas", "ingles", "wizard", "cultura inglesa", "fisk", "cna", "apostila", "material escolar", "pos-graduacao", "mestrado"],
  },
  {
    category: TransactionCategory.NECESSITIES,
    keywords: ["necessidade", "necessidades", "item essencial", "compra essencial"],
  },
  {
    category: TransactionCategory.OCCASIONAL_EXPENSES,
    keywords: ["despesa eventual", "imprevisto", "emergencia", "reparo emergencial"],
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestCategory(description: string): TransactionCategory {
  const normalized = ` ${normalize(description)} `;

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      const cleanKeyword = normalize(keyword);
      if (normalized.includes(` ${cleanKeyword} `)) return rule.category;
      // Multiword merchant brands also appear with account suffixes, e.g. "Netflix 123".
      if (cleanKeyword.includes(" ") && normalized.includes(` ${cleanKeyword}`)) return rule.category;
    }
  }

  return TransactionCategory.OTHER;
}
