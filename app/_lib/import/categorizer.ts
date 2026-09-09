import { TransactionCategory } from "@prisma/client";

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: TransactionCategory.TRANSPORTATION,
    keywords: [
      "uber",
      "99",
      "99app",
      "99pop",
      "99taxi",
      "cabify",
      "indrive",
      "posto",
      "shell",
      "ipiranga",
      "petrobras",
      "ale",
      "combustivel",
      "gasolina",
      "etanol",
      "sem parar",
      "veloe",
      "conectcar",
      "estacionamento",
      "pedagio",
      "auto posto",
      "metro",
      "cptm",
      "onibus",
      "passagem",
      "latam",
      "gol",
      "azul",
      "voegol",
      "rentcars",
      "localiza",
      "movida",
      "oficina",
      "mecanic",
      "pneu",
      "estac",
    ],
  },
  {
    category: TransactionCategory.FOOD,
    keywords: [
      "ifood",
      "rappi",
      "ze delivery",
      "restaurante",
      "rest",
      "lanchonete",
      "mcdonald",
      "mc donald",
      "burger king",
      "bk",
      "subway",
      "padaria",
      "panificadora",
      "pizzaria",
      "bar ",
      "churrascaria",
      "supermercado",
      "mercado",
      "carrefour",
      "extra",
      "pao de acucar",
      "assai",
      "atacadao",
      "big",
      "hortifruti",
      "acougue",
      "cafe",
      "coffee",
      "starbucks",
      "sorveteria",
      "cantina",
      "bistr",
      "hamburguer",
      "delivery",
      "comida",
      "alimento",
      "mercearia",
      "sacolao",
      "chocolat",
      "doceria",
      "emporio",
      "sushi",
    ],
  },
  {
    category: TransactionCategory.ENTERTAINMENT,
    keywords: [
      "netflix",
      "spotify",
      "amazon prime",
      "prime video",
      "disney",
      "hbo",
      "max",
      "youtube",
      "cinema",
      "cinemark",
      "cinepolis",
      "ingresso",
      "steam",
      "playstation",
      "psn",
      "xbox",
      "twitch",
      "show",
      "teatro",
      "jogos",
      "deezer",
      "apple music",
      "apple.com/bill",
      "google play",
      "globo play",
      "globoplay",
      "paramount",
      "crunchyroll",
      "evento",
      "sympla",
      "eventim",
    ],
  },
  {
    category: TransactionCategory.HOUSING,
    keywords: [
      "aluguel",
      "condominio",
      "enel",
      "copel",
      "cemig",
      "cpfl",
      "sabesp",
      "sanepar",
      "copasa",
      "luz",
      "energia",
      "agua",
      "gas",
      "internet",
      "claro",
      "vivo",
      "tim",
      "oi fibra",
      "iptu",
      "imobiliaria",
      "leroy merlin",
      "telhanorte",
      "c&c",
      "marabraz",
      "tok&stok",
      "moveis",
      "reforma",
      "limpeza",
      "diarista",
      "eletropaulo",
    ],
  },
  {
    category: TransactionCategory.HEALTH,
    keywords: [
      "farmacia",
      "drogaria",
      "drogasil",
      "raia",
      "pacheco",
      "sao paulo",
      "panvel",
      "hospital",
      "clinica",
      "medico",
      "consulta",
      "dentista",
      "odonto",
      "laboratorio",
      "exame",
      "unimed",
      "bradesco saude",
      "sulamerica",
      "notredame",
      "hapvida",
      "amil",
      "psicolog",
      "terapia",
      "academia",
      "smart fit",
      "bluefit",
      "fisioterapia",
      "oftalmo",
      "otica",
      "remedio",
      "medicamento",
    ],
  },
  {
    category: TransactionCategory.SALARY,
    keywords: [
      "salario",
      "folha de pagamento",
      "remuneracao",
      "pro-labore",
      "pro labore",
      "rendimento",
      "ted recebida",
      "pix recebido salario",
      "ordenado",
      "honorarios",
      "adiantamento salarial",
      "beneficio",
      "inss",
      "13o",
      "decimo terceiro",
      "estagio",
      "bolsa auxilio",
    ],
  },
  {
    category: TransactionCategory.EDUCATION,
    keywords: [
      "escola",
      "colegio",
      "faculdade",
      "universidade",
      "curso",
      "udemy",
      "alura",
      "coursera",
      "livro",
      "livraria",
      "mensalidade escolar",
      "idiomas",
      "ingles",
      "wizard",
      "cultura inglesa",
      "fisk",
      "cna",
      "apostila",
      "material escolar",
      "pos-graduacao",
      "mestrado",
    ],
  },
];

export function suggestCategory(description: string): TransactionCategory {
  const normalized = ` ${description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      const cleanKeyword = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      // For words of 4 or fewer characters, ensure word boundary match
      if (cleanKeyword.length <= 4) {
        const regex = new RegExp(`\\b${cleanKeyword}\\b`, "i");
        if (regex.test(normalized)) {
          return rule.category;
        }
      } else {
        if (normalized.includes(cleanKeyword)) {
          return rule.category;
        }
      }
    }
  }

  return TransactionCategory.OTHER;
}
