-- Replace the broad category enum while preserving every existing financial row.
ALTER TABLE "Transaction"
  ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "MonthlyCommitment"
  ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "RecurringCommitment"
  ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

ALTER TYPE "TransactionCategory" RENAME TO "TransactionCategory_legacy";

CREATE TYPE "TransactionCategory" AS ENUM (
  'SALARY',
  'HOME',
  'NECESSITIES',
  'WATER',
  'ELECTRICITY',
  'INTERNET',
  'FOOD',
  'TRANSPORTATION',
  'GASOLINE',
  'MECHANICS',
  'HEALTH_PHARMACY',
  'PSYCHOLOGIST',
  'GYM',
  'EDUCATION',
  'DEVELOPMENT',
  'IFOOD',
  'SUBSCRIPTIONS',
  'CLOTHING',
  'BEAUTY_SALON',
  'LEISURE',
  'ENTERTAINMENT',
  'GIFTS',
  'OCCASIONAL_EXPENSES',
  'OTHER'
);

CREATE FUNCTION public.map_legacy_transaction_category(old_category TEXT, entry_description TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE old_category
    WHEN 'HOUSING' THEN CASE
      WHEN entry_description ILIKE '%água%' OR entry_description ILIKE '%agua%'
        OR entry_description ILIKE ANY (ARRAY['%sabesp%', '%sanepar%', '%copasa%', '%saae%', '%caesb%', '%embasa%', '%corsan%', '%cagece%', '%cesan%', '%sanasa%']) THEN 'WATER'
      WHEN entry_description ~* '\mluz\M' OR entry_description ILIKE '%energia elétrica%'
        OR entry_description ILIKE '%energia eletrica%'
        OR entry_description ILIKE ANY (ARRAY['%enel%', '%copel%', '%cemig%', '%cpfl%', '%eletropaulo%', '%neoenergia%', '%energisa%', '%celesc%', '%equatorial%', '%light%', '%edp%', '%rge%']) THEN 'ELECTRICITY'
      WHEN entry_description ILIKE ANY (ARRAY['%internet%', '%banda larga%', '%fibra%', '%provedor%', '%claro%', '%vivo%', '%tim%', '%oi fibra%']) THEN 'INTERNET'
      ELSE 'HOME'
    END
    WHEN 'TRANSPORTATION' THEN CASE
      WHEN entry_description ILIKE ANY (ARRAY['%oficina%', '%mecânic%', '%mecanic%', '%pneu%', '%autopeças%', '%autopecas%', '%funilaria%', '%borracharia%', '%troca de óleo%', '%troca de oleo%']) THEN 'MECHANICS'
      WHEN entry_description ILIKE ANY (ARRAY['%gasolina%', '%combustível%', '%combustivel%', '%etanol%', '%posto%', '%shell%', '%ipiranga%', '%petrobras%', '%ale combustíveis%', '%ale combustiveis%', '%abastecimento%']) THEN 'GASOLINE'
      ELSE 'TRANSPORTATION'
    END
    WHEN 'FOOD' THEN CASE WHEN entry_description ILIKE '%ifood%' THEN 'IFOOD' ELSE 'FOOD' END
    WHEN 'ENTERTAINMENT' THEN CASE
      WHEN entry_description ILIKE ANY (ARRAY['%netflix%', '%spotify%', '%amazon prime%', '%prime video%', '%disney%', '%hbo%', '%max%', '%youtube premium%', '%deezer%', '%apple music%', '%globoplay%', '%globo play%', '%paramount%', '%crunchyroll%']) THEN 'SUBSCRIPTIONS'
      WHEN entry_description ILIKE ANY (ARRAY['%viagem%', '%hotel%', '%pousada%', '%resort%', '%parque%', '%museu%', '%passeio%', '%turismo%', '%praia%', '%cruzeiro%']) THEN 'LEISURE'
      ELSE 'ENTERTAINMENT'
    END
    WHEN 'HEALTH' THEN CASE
      WHEN entry_description ILIKE ANY (ARRAY['%psicólog%', '%psicolog%', '%terapia%', '%psicoterap%', '%psiquiatra%']) THEN 'PSYCHOLOGIST'
      WHEN entry_description ILIKE ANY (ARRAY['%academia%', '%smart fit%', '%bluefit%', '%bodytech%', '%gympass%', '%wellhub%', '%totalpass%', '%crossfit%']) THEN 'GYM'
      ELSE 'HEALTH_PHARMACY'
    END
    WHEN 'EDUCATION' THEN CASE
      WHEN entry_description ILIKE ANY (ARRAY['%udemy%', '%alura%', '%coursera%', '%linkedin learning%', '%pluralsight%', '%certificação%', '%certificacao%', '%desenvolvimento profissional%']) THEN 'DEVELOPMENT'
      ELSE 'EDUCATION'
    END
    WHEN 'SALARY' THEN 'SALARY'
    ELSE 'OTHER'
  END;
$$;

UPDATE "Transaction"
SET "category" = public.map_legacy_transaction_category("category", "name");
UPDATE "MonthlyCommitment"
SET "category" = public.map_legacy_transaction_category("category", "description");
UPDATE "RecurringCommitment"
SET "category" = public.map_legacy_transaction_category("category", "description");

ALTER TABLE "Transaction"
  ALTER COLUMN "category" TYPE "TransactionCategory" USING "category"::"TransactionCategory";
ALTER TABLE "MonthlyCommitment"
  ALTER COLUMN "category" TYPE "TransactionCategory" USING "category"::"TransactionCategory";
ALTER TABLE "RecurringCommitment"
  ALTER COLUMN "category" TYPE "TransactionCategory" USING "category"::"TransactionCategory";

DROP FUNCTION public.map_legacy_transaction_category(TEXT, TEXT);
DROP TYPE "TransactionCategory_legacy";
