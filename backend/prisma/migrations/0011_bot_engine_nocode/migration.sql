-- CreateEnum
CREATE TYPE "BotBlockType" AS ENUM ('MESSAGE', 'CONDITION', 'ACTION', 'INPUT', 'DELAY', 'SPLIT', 'REDIRECT', 'NOTIFY_ADMIN', 'HTTP', 'REACTION');

-- CreateTable
CREATE TABLE "bot_block_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bot_block_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_blocks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group_id" TEXT,
    "type" "BotBlockType" NOT NULL,

    "text" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "parse_mode" TEXT NOT NULL DEFAULT 'Markdown',
    "pin_message" BOOLEAN NOT NULL DEFAULT false,

    "delete_prev" TEXT NOT NULL DEFAULT 'none',

    "reply_keyboard" JSONB,
    "remove_reply_kb" BOOLEAN NOT NULL DEFAULT false,

    "condition_type" TEXT,
    "condition_value" TEXT,
    "next_block_true" TEXT,
    "next_block_false" TEXT,

    "action_type" TEXT,
    "action_value" TEXT,
    "next_block_id" TEXT,

    "input_prompt" TEXT,
    "input_var" TEXT,
    "input_validation" TEXT,

    "delay_minutes" INTEGER,

    "split_variants" JSONB,

    "redirect_block_id" TEXT,

    "reaction_emoji" TEXT,

    "notify_admin_text" TEXT,

    "http_method" TEXT,
    "http_url" TEXT,
    "http_headers" JSONB,
    "http_body" TEXT,
    "http_save_var" TEXT,

    "throttle_minutes" INTEGER,

    "schedule_start" TEXT,
    "schedule_end" TEXT,
    "schedule_days" JSONB,
    "schedule_block_id" TEXT,

    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),

    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_buttons" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "next_block_id" TEXT,
    "url" TEXT,
    "row" INTEGER NOT NULL DEFAULT 0,
    "col" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bot_buttons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_triggers" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bot_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_block_stats" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "bot_block_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_variables" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_variables_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "bot_blocks_group_id_idx" ON "bot_blocks"("group_id");
CREATE INDEX "bot_blocks_type_idx" ON "bot_blocks"("type");
CREATE INDEX "bot_buttons_block_id_idx" ON "bot_buttons"("block_id");
CREATE INDEX "bot_triggers_type_idx" ON "bot_triggers"("type");
CREATE UNIQUE INDEX "bot_triggers_type_value_key" ON "bot_triggers"("type", "value");
CREATE UNIQUE INDEX "bot_block_stats_block_id_date_key" ON "bot_block_stats"("block_id", "date");
CREATE UNIQUE INDEX "user_tags_user_id_tag_key" ON "user_tags"("user_id", "tag");
CREATE INDEX "user_tags_tag_idx" ON "user_tags"("tag");
CREATE UNIQUE INDEX "user_variables_user_id_key_key" ON "user_variables"("user_id", "key");
CREATE INDEX "user_variables_key_idx" ON "user_variables"("key");

-- AddForeignKeys
ALTER TABLE "bot_blocks" ADD CONSTRAINT "bot_blocks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "bot_block_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bot_buttons" ADD CONSTRAINT "bot_buttons_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "bot_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_triggers" ADD CONSTRAINT "bot_triggers_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "bot_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bot_block_stats" ADD CONSTRAINT "bot_block_stats_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "bot_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_variables" ADD CONSTRAINT "user_variables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
