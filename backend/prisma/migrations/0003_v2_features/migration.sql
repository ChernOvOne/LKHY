-- ============================================================
--  Migration: v2 features
--  News, Promos, Proxies, Gifts, Balance, Notifications,
--  AuditLog, AdminNotes + User/Payment/Tariff updates
-- ============================================================

-- New enums
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'PROMO');
CREATE TYPE "BalanceType" AS ENUM ('TOPUP', 'PURCHASE', 'REFERRAL', 'GIFT', 'REFUND', 'ADMIN');

-- Extend PaymentProvider
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'BALANCE';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'GIFT';

-- ── User updates ─────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_used" BOOLEAN NOT NULL DEFAULT false;

-- ── Payment updates ──────────────────────────────────────────
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "gift_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "is_gift" BOOLEAN NOT NULL DEFAULT false;

-- ── Tariff updates ───────────────────────────────────────────
ALTER TABLE "tariffs" ADD COLUMN IF NOT EXISTS "show_on_landing" BOOLEAN NOT NULL DEFAULT true;

-- ── ReferralBonus updates ────────────────────────────────────
ALTER TABLE "referral_bonuses" ADD COLUMN IF NOT EXISTS "bonus_amount" DOUBLE PRECISION;

-- ── News ─────────────────────────────────────────────────────
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- ── Promos ───────────────────────────────────────────────────
CREATE TABLE "promos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "image_url" TEXT,
    "button_text" TEXT,
    "button_url" TEXT,
    "discount" DOUBLE PRECISION,
    "tariff_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promos_pkey" PRIMARY KEY ("id")
);

-- ── TG Proxies ───────────────────────────────────────────────
CREATE TABLE "tg_proxies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tg_link" TEXT NOT NULL,
    "https_link" TEXT,
    "tag" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tg_proxies_pkey" PRIMARY KEY ("id")
);

-- ── Gift Subscriptions ───────────────────────────────────────
CREATE TABLE "gift_subscriptions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT,
    "tariff_id" TEXT NOT NULL,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "recipient_email" TEXT,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gift_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gift_subscriptions_code_key" ON "gift_subscriptions"("code");

ALTER TABLE "gift_subscriptions"
    ADD CONSTRAINT "gift_subscriptions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "gift_subscriptions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "gift_subscriptions_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "details" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- ── Admin Notes ──────────────────────────────────────────────
CREATE TABLE "admin_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "admin_notes"
    ADD CONSTRAINT "admin_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Balance Transactions ─────────────────────────────────────
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "BalanceType" NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "balance_transactions"
    ADD CONSTRAINT "balance_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");
CREATE INDEX "audit_logs_target_idx" ON "audit_logs"("target_type", "target_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
CREATE INDEX "admin_notes_user_id_idx" ON "admin_notes"("user_id");
CREATE INDEX "balance_transactions_user_id_idx" ON "balance_transactions"("user_id");
CREATE INDEX "news_published_at_idx" ON "news"("published_at" DESC);
CREATE INDEX "promos_is_active_idx" ON "promos"("is_active");
CREATE INDEX "gift_subscriptions_code_idx" ON "gift_subscriptions"("code");
CREATE INDEX "gift_subscriptions_sender_id_idx" ON "gift_subscriptions"("sender_id");
