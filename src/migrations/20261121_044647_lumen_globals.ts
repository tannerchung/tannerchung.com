import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_settings_active_theme" AS ENUM('lumen', 'grid', 'cobalt');
  CREATE TYPE "payload"."enum_site_settings_default_drop" AS ENUM('night', 'day');
  CREATE TABLE "payload"."site_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"site_name" varchar DEFAULT 'tannerchung.com' NOT NULL,
  	"tagline" varchar DEFAULT 'systems, engineering & capital craft.',
  	"location_readout" varchar DEFAULT 'BROOKLYN, NY // EST. 2026',
  	"active_theme" "payload"."enum_site_settings_active_theme" DEFAULT 'lumen' NOT NULL,
  	"default_drop" "payload"."enum_site_settings_default_drop" DEFAULT 'night' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."trade_desk_settings_standing_guardrails" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"rule" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."trade_desk_settings" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"desk_label" varchar DEFAULT 'sovereign wealth & execution desk' NOT NULL,
  	"cash_floor_target" varchar DEFAULT '$95,000 Cash & Treasury Floor (Thru Nov 30)',
  	"max_option_spread_pct" numeric DEFAULT 8,
  	"tax_shield_readout" varchar DEFAULT '-$18.5k Realized Schwab TLH Carry · $0.00 Net Tax Target',
  	"wash_sale_blackout_through" varchar DEFAULT '2026-12-10',
  	"wash_sale_tickers" varchar DEFAULT 'DRAM, EUAD, ICLN, INTC, KTEC, MAGC, MRVL, SHLD, SMH',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN "site_settings_find" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN "site_settings_update" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN "trade_desk_settings_find" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD COLUMN "trade_desk_settings_update" boolean DEFAULT false;
  ALTER TABLE "payload"."trade_desk_settings_standing_guardrails" ADD CONSTRAINT "trade_desk_settings_standing_guardrails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_desk_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "trade_desk_settings_standing_guardrails_order_idx" ON "payload"."trade_desk_settings_standing_guardrails" USING btree ("_order");
  CREATE INDEX "trade_desk_settings_standing_guardrails_parent_id_idx" ON "payload"."trade_desk_settings_standing_guardrails" USING btree ("_parent_id");
  ALTER TABLE "payload"."site_settings" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_desk_settings" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_desk_settings_standing_guardrails" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_settings" CASCADE;
  DROP TABLE "payload"."trade_desk_settings_standing_guardrails" CASCADE;
  DROP TABLE "payload"."trade_desk_settings" CASCADE;
  ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN "site_settings_find";
  ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN "site_settings_update";
  ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN "trade_desk_settings_find";
  ALTER TABLE "payload"."payload_mcp_api_keys" DROP COLUMN "trade_desk_settings_update";
  DROP TYPE "payload"."enum_site_settings_active_theme";
  DROP TYPE "payload"."enum_site_settings_default_drop";`)
}
