CREATE TYPE "BillingProvider" AS ENUM ('MERCADO_PAGO', 'CAKTO');

ALTER TABLE "MercadoPagoSubscription"
  ADD COLUMN "provider" "BillingProvider" NOT NULL DEFAULT 'MERCADO_PAGO',
  ADD COLUMN "caktoCallbackToken" TEXT,
  ADD COLUMN "caktoProductId" TEXT,
  ADD COLUMN "caktoOfferId" TEXT,
  ADD COLUMN "caktoOrderId" TEXT,
  ADD COLUMN "providerEventAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "MercadoPagoSubscription_caktoCallbackToken_key" ON "MercadoPagoSubscription"("caktoCallbackToken");
CREATE UNIQUE INDEX "MercadoPagoSubscription_caktoOrderId_key" ON "MercadoPagoSubscription"("caktoOrderId");
CREATE INDEX "MercadoPagoSubscription_provider_userId_status_idx" ON "MercadoPagoSubscription"("provider", "userId", "status");

CREATE TABLE "CaktoWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "productId" TEXT,
  "outcome" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "CaktoWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaktoWebhookEvent_eventKey_key" ON "CaktoWebhookEvent"("eventKey");
CREATE INDEX "CaktoWebhookEvent_providerEventId_eventType_idx" ON "CaktoWebhookEvent"("providerEventId", "eventType");
CREATE INDEX "CaktoWebhookEvent_createdAt_idx" ON "CaktoWebhookEvent"("createdAt");
