import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_trade_notes_conviction" AS ENUM('high', 'medium', 'watch', 'avoid');
  CREATE TYPE "payload"."enum_trade_notes_valuation_zone" AS ENUM('buy_zone', 'hold_zone', 'trim_zone');
  CREATE TYPE "payload"."enum_trade_notes_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__trade_notes_v_version_conviction" AS ENUM('high', 'medium', 'watch', 'avoid');
  CREATE TYPE "payload"."enum__trade_notes_v_version_valuation_zone" AS ENUM('buy_zone', 'hold_zone', 'trim_zone');
  CREATE TYPE "payload"."enum__trade_notes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_exec_mandate_posture" AS ENUM('risk_on', 'balanced', 'defensive', 'stand_aside');
  CREATE TYPE "payload"."enum_trade_sheets_blocks_move_rationales_items_conviction" AS ENUM('high', 'medium', 'low', 'trim', 'hold');
  CREATE TYPE "payload"."enum_trade_sheets_blocks_panel_debates_seats_stance" AS ENUM('approve', 'caution', 'dissent', 'abstain');
  CREATE TYPE "payload"."enum_red_team_blind_spots_category" AS ENUM('macro', 'concentration', 'liquidity', 'tax_wash_sale', 'options_pin', 'valuation');
  CREATE TYPE "payload"."enum_red_team_blind_spots_severity" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "payload"."enum_red_team_overall_severity" AS ENUM('low', 'elevated', 'critical');
  CREATE TYPE "payload"."enum_trade_sheets_blocks_news_catalysts_items_catalyst_kind" AS ENUM('sec_filing', 'earnings', 'macro', 'analyst', 'geopolitical');
  CREATE TYPE "payload"."enum_trade_sheets_blocks_desk_annotation_scope" AS ENUM('session', 'ticker', 'risk_override', 'post_mortem');
  CREATE TYPE "payload"."enum_trade_sheets_citations_kind" AS ENUM('sec_filing', 'news', 'macro', 'research');
  CREATE TYPE "payload"."enum_trade_sheets_source_mode" AS ENUM('curated', 'auto_vm', 'manual');
  CREATE TABLE "payload"."_trade_notes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_ticker" varchar,
  	"version_conviction" "payload"."enum__trade_notes_v_version_conviction" DEFAULT 'high',
  	"version_valuation_zone" "payload"."enum__trade_notes_v_version_valuation_zone" DEFAULT 'hold_zone',
  	"version_strategy" varchar,
  	"version_thesis" jsonb,
  	"version_metrics_json" jsonb,
  	"version_sheet_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__trade_notes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."exec_mandate_summary_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."exec_mandate_hold_off_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."exec_mandate" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"posture" "payload"."enum_exec_mandate_posture" DEFAULT 'balanced' NOT NULL,
  	"mandate_headline" varchar NOT NULL,
  	"cash_floor_gate" varchar,
  	"regime_call" varchar,
  	"citation_refs" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_move_rationales_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ticker" varchar NOT NULL,
  	"action" varchar NOT NULL,
  	"conviction" "payload"."enum_trade_sheets_blocks_move_rationales_items_conviction" DEFAULT 'medium',
  	"horizon" varchar,
  	"rationale" varchar NOT NULL,
  	"key_risks" varchar,
  	"citation_refs" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_move_rationales" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_title" varchar DEFAULT 'Ticket-by-Ticket Action Rationale',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_panel_debates_seats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"seat_key" varchar NOT NULL,
  	"seat_name" varchar NOT NULL,
  	"stance" "payload"."enum_trade_sheets_blocks_panel_debates_seats_stance" DEFAULT 'approve' NOT NULL,
  	"thesis" varchar NOT NULL,
  	"objection" varchar,
  	"citation_refs" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_panel_debates" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar NOT NULL,
  	"consensus_summary" varchar,
  	"dissent_headline" varchar,
  	"strongest_unresolved_objection" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."red_team_blind_spots" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "payload"."enum_red_team_blind_spots_category" DEFAULT 'concentration',
  	"severity" "payload"."enum_red_team_blind_spots_severity" DEFAULT 'medium',
  	"claim" varchar NOT NULL,
  	"mitigation" varchar,
  	"citation_refs" varchar
  );
  
  CREATE TABLE "payload"."red_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"challenger_title" varchar DEFAULT 'Autonomous Red-Team & Second-Level Blind Spots',
  	"overall_severity" "payload"."enum_red_team_overall_severity" DEFAULT 'elevated',
  	"pre_mortem_summary" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_news_catalysts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ticker" varchar,
  	"headline" varchar NOT NULL,
  	"catalyst_kind" "payload"."enum_trade_sheets_blocks_news_catalysts_items_catalyst_kind" DEFAULT 'sec_filing',
  	"impact_summary" varchar,
  	"published_at" varchar,
  	"citation_index" numeric
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_news_catalysts" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"window_label" varchar DEFAULT 'Last 72h Corroborated Wire & SEC Filings',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_blocks_desk_annotation" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author" varchar DEFAULT 'Tanner Chung',
  	"pin_to_top" boolean DEFAULT true,
  	"scope" "payload"."enum_trade_sheets_blocks_desk_annotation_scope" DEFAULT 'session',
  	"ticker" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"created_at_note" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"index" numeric NOT NULL,
  	"ticker" varchar,
  	"source" varchar NOT NULL,
  	"kind" "payload"."enum_trade_sheets_citations_kind" DEFAULT 'news',
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"published_at" varchar
  );
  
  CREATE TABLE "payload"."trade_sheets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"trade_notes_id" uuid
  );
  
  CREATE TABLE "payload"."trade_desk_settings_ic_seats" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"seat_key" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"archetype" varchar NOT NULL,
  	"mandate" varchar NOT NULL
  );
  
  ALTER TABLE "payload"."trade_notes" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "payload"."trade_notes" ADD COLUMN "conviction" "payload"."enum_trade_notes_conviction" DEFAULT 'high';
  ALTER TABLE "payload"."trade_notes" ADD COLUMN "valuation_zone" "payload"."enum_trade_notes_valuation_zone" DEFAULT 'hold_zone';
  ALTER TABLE "payload"."trade_notes" ADD COLUMN "_status" "payload"."enum_trade_notes_status" DEFAULT 'published';
  UPDATE "payload"."trade_notes" SET "_status" = 'published' WHERE "_status" IS NULL;
  ALTER TABLE "payload"."trade_sheets" ADD COLUMN "source_mode" "payload"."enum_trade_sheets_source_mode" DEFAULT 'curated';
  ALTER TABLE "payload"."trade_desk_settings" ADD COLUMN "ips_targets_target_beta_max" numeric DEFAULT 1.15;
  ALTER TABLE "payload"."trade_desk_settings" ADD COLUMN "ips_targets_min_cash_floor_usd" numeric DEFAULT 95000;
  ALTER TABLE "payload"."trade_desk_settings" ADD COLUMN "ips_targets_core_allocation_target_pct" numeric DEFAULT 75;
  ALTER TABLE "payload"."trade_desk_settings" ADD COLUMN "ips_targets_satellite_max_single_weight_pct" numeric DEFAULT 8;
  ALTER TABLE "payload"."_trade_notes_v" ADD CONSTRAINT "_trade_notes_v_parent_id_trade_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."trade_notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."exec_mandate_summary_points" ADD CONSTRAINT "exec_mandate_summary_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."exec_mandate"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."exec_mandate_hold_off_notes" ADD CONSTRAINT "exec_mandate_hold_off_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."exec_mandate"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."exec_mandate" ADD CONSTRAINT "exec_mandate_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales_items" ADD CONSTRAINT "trade_sheets_blocks_move_rationales_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets_blocks_move_rationales"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales" ADD CONSTRAINT "trade_sheets_blocks_move_rationales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates_seats" ADD CONSTRAINT "trade_sheets_blocks_panel_debates_seats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets_blocks_panel_debates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates" ADD CONSTRAINT "trade_sheets_blocks_panel_debates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."red_team_blind_spots" ADD CONSTRAINT "red_team_blind_spots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."red_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."red_team" ADD CONSTRAINT "red_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts_items" ADD CONSTRAINT "trade_sheets_blocks_news_catalysts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets_blocks_news_catalysts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts" ADD CONSTRAINT "trade_sheets_blocks_news_catalysts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_blocks_desk_annotation" ADD CONSTRAINT "trade_sheets_blocks_desk_annotation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_citations" ADD CONSTRAINT "trade_sheets_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_rels" ADD CONSTRAINT "trade_sheets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_sheets_rels" ADD CONSTRAINT "trade_sheets_rels_trade_notes_fk" FOREIGN KEY ("trade_notes_id") REFERENCES "payload"."trade_notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."trade_desk_settings_ic_seats" ADD CONSTRAINT "trade_desk_settings_ic_seats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."trade_desk_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_trade_notes_v_parent_idx" ON "payload"."_trade_notes_v" USING btree ("parent_id");
  CREATE INDEX "_trade_notes_v_version_version_ticker_idx" ON "payload"."_trade_notes_v" USING btree ("version_ticker");
  CREATE INDEX "_trade_notes_v_version_version_updated_at_idx" ON "payload"."_trade_notes_v" USING btree ("version_updated_at");
  CREATE INDEX "_trade_notes_v_version_version_created_at_idx" ON "payload"."_trade_notes_v" USING btree ("version_created_at");
  CREATE INDEX "_trade_notes_v_version_version__status_idx" ON "payload"."_trade_notes_v" USING btree ("version__status");
  CREATE INDEX "_trade_notes_v_created_at_idx" ON "payload"."_trade_notes_v" USING btree ("created_at");
  CREATE INDEX "_trade_notes_v_updated_at_idx" ON "payload"."_trade_notes_v" USING btree ("updated_at");
  CREATE INDEX "_trade_notes_v_latest_idx" ON "payload"."_trade_notes_v" USING btree ("latest");
  CREATE INDEX "exec_mandate_summary_points_order_idx" ON "payload"."exec_mandate_summary_points" USING btree ("_order");
  CREATE INDEX "exec_mandate_summary_points_parent_id_idx" ON "payload"."exec_mandate_summary_points" USING btree ("_parent_id");
  CREATE INDEX "exec_mandate_hold_off_notes_order_idx" ON "payload"."exec_mandate_hold_off_notes" USING btree ("_order");
  CREATE INDEX "exec_mandate_hold_off_notes_parent_id_idx" ON "payload"."exec_mandate_hold_off_notes" USING btree ("_parent_id");
  CREATE INDEX "exec_mandate_order_idx" ON "payload"."exec_mandate" USING btree ("_order");
  CREATE INDEX "exec_mandate_parent_id_idx" ON "payload"."exec_mandate" USING btree ("_parent_id");
  CREATE INDEX "exec_mandate_path_idx" ON "payload"."exec_mandate" USING btree ("_path");
  CREATE INDEX "trade_sheets_blocks_move_rationales_items_order_idx" ON "payload"."trade_sheets_blocks_move_rationales_items" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_move_rationales_items_parent_id_idx" ON "payload"."trade_sheets_blocks_move_rationales_items" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_move_rationales_order_idx" ON "payload"."trade_sheets_blocks_move_rationales" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_move_rationales_parent_id_idx" ON "payload"."trade_sheets_blocks_move_rationales" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_move_rationales_path_idx" ON "payload"."trade_sheets_blocks_move_rationales" USING btree ("_path");
  CREATE INDEX "trade_sheets_blocks_panel_debates_seats_order_idx" ON "payload"."trade_sheets_blocks_panel_debates_seats" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_panel_debates_seats_parent_id_idx" ON "payload"."trade_sheets_blocks_panel_debates_seats" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_panel_debates_order_idx" ON "payload"."trade_sheets_blocks_panel_debates" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_panel_debates_parent_id_idx" ON "payload"."trade_sheets_blocks_panel_debates" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_panel_debates_path_idx" ON "payload"."trade_sheets_blocks_panel_debates" USING btree ("_path");
  CREATE INDEX "red_team_blind_spots_order_idx" ON "payload"."red_team_blind_spots" USING btree ("_order");
  CREATE INDEX "red_team_blind_spots_parent_id_idx" ON "payload"."red_team_blind_spots" USING btree ("_parent_id");
  CREATE INDEX "red_team_order_idx" ON "payload"."red_team" USING btree ("_order");
  CREATE INDEX "red_team_parent_id_idx" ON "payload"."red_team" USING btree ("_parent_id");
  CREATE INDEX "red_team_path_idx" ON "payload"."red_team" USING btree ("_path");
  CREATE INDEX "trade_sheets_blocks_news_catalysts_items_order_idx" ON "payload"."trade_sheets_blocks_news_catalysts_items" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_news_catalysts_items_parent_id_idx" ON "payload"."trade_sheets_blocks_news_catalysts_items" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_news_catalysts_order_idx" ON "payload"."trade_sheets_blocks_news_catalysts" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_news_catalysts_parent_id_idx" ON "payload"."trade_sheets_blocks_news_catalysts" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_news_catalysts_path_idx" ON "payload"."trade_sheets_blocks_news_catalysts" USING btree ("_path");
  CREATE INDEX "trade_sheets_blocks_desk_annotation_order_idx" ON "payload"."trade_sheets_blocks_desk_annotation" USING btree ("_order");
  CREATE INDEX "trade_sheets_blocks_desk_annotation_parent_id_idx" ON "payload"."trade_sheets_blocks_desk_annotation" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_blocks_desk_annotation_path_idx" ON "payload"."trade_sheets_blocks_desk_annotation" USING btree ("_path");
  CREATE INDEX "trade_sheets_citations_order_idx" ON "payload"."trade_sheets_citations" USING btree ("_order");
  CREATE INDEX "trade_sheets_citations_parent_id_idx" ON "payload"."trade_sheets_citations" USING btree ("_parent_id");
  CREATE INDEX "trade_sheets_rels_order_idx" ON "payload"."trade_sheets_rels" USING btree ("order");
  CREATE INDEX "trade_sheets_rels_parent_idx" ON "payload"."trade_sheets_rels" USING btree ("parent_id");
  CREATE INDEX "trade_sheets_rels_path_idx" ON "payload"."trade_sheets_rels" USING btree ("path");
  CREATE INDEX "trade_sheets_rels_trade_notes_id_idx" ON "payload"."trade_sheets_rels" USING btree ("trade_notes_id");
  CREATE INDEX "trade_desk_settings_ic_seats_order_idx" ON "payload"."trade_desk_settings_ic_seats" USING btree ("_order");
  CREATE INDEX "trade_desk_settings_ic_seats_parent_id_idx" ON "payload"."trade_desk_settings_ic_seats" USING btree ("_parent_id");
  CREATE INDEX "trade_notes__status_idx" ON "payload"."trade_notes" USING btree ("_status");
  ALTER TABLE "payload"."_trade_notes_v" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate_summary_points" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate_hold_off_notes" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales_items" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates_seats" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."red_team_blind_spots" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."red_team" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts_items" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_desk_annotation" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_citations" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_rels" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_desk_settings_ic_seats" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."_trade_notes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate_summary_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate_hold_off_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."exec_mandate" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_move_rationales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates_seats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_panel_debates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."red_team_blind_spots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."red_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_news_catalysts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_blocks_desk_annotation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_citations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_sheets_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."trade_desk_settings_ic_seats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."_trade_notes_v" CASCADE;
  DROP TABLE "payload"."exec_mandate_summary_points" CASCADE;
  DROP TABLE "payload"."exec_mandate_hold_off_notes" CASCADE;
  DROP TABLE "payload"."exec_mandate" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_move_rationales_items" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_move_rationales" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_panel_debates_seats" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_panel_debates" CASCADE;
  DROP TABLE "payload"."red_team_blind_spots" CASCADE;
  DROP TABLE "payload"."red_team" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_news_catalysts_items" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_news_catalysts" CASCADE;
  DROP TABLE "payload"."trade_sheets_blocks_desk_annotation" CASCADE;
  DROP TABLE "payload"."trade_sheets_citations" CASCADE;
  DROP TABLE "payload"."trade_sheets_rels" CASCADE;
  DROP TABLE "payload"."trade_desk_settings_ic_seats" CASCADE;
  DROP INDEX "payload"."trade_notes__status_idx";
  ALTER TABLE "payload"."trade_notes" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "payload"."trade_notes" DROP COLUMN "conviction";
  ALTER TABLE "payload"."trade_notes" DROP COLUMN "valuation_zone";
  ALTER TABLE "payload"."trade_notes" DROP COLUMN "_status";
  ALTER TABLE "payload"."trade_sheets" DROP COLUMN "source_mode";
  ALTER TABLE "payload"."trade_desk_settings" DROP COLUMN "ips_targets_target_beta_max";
  ALTER TABLE "payload"."trade_desk_settings" DROP COLUMN "ips_targets_min_cash_floor_usd";
  ALTER TABLE "payload"."trade_desk_settings" DROP COLUMN "ips_targets_core_allocation_target_pct";
  ALTER TABLE "payload"."trade_desk_settings" DROP COLUMN "ips_targets_satellite_max_single_weight_pct";
  DROP TYPE "payload"."enum_trade_notes_conviction";
  DROP TYPE "payload"."enum_trade_notes_valuation_zone";
  DROP TYPE "payload"."enum_trade_notes_status";
  DROP TYPE "payload"."enum__trade_notes_v_version_conviction";
  DROP TYPE "payload"."enum__trade_notes_v_version_valuation_zone";
  DROP TYPE "payload"."enum__trade_notes_v_version_status";
  DROP TYPE "payload"."enum_exec_mandate_posture";
  DROP TYPE "payload"."enum_trade_sheets_blocks_move_rationales_items_conviction";
  DROP TYPE "payload"."enum_trade_sheets_blocks_panel_debates_seats_stance";
  DROP TYPE "payload"."enum_red_team_blind_spots_category";
  DROP TYPE "payload"."enum_red_team_blind_spots_severity";
  DROP TYPE "payload"."enum_red_team_overall_severity";
  DROP TYPE "payload"."enum_trade_sheets_blocks_news_catalysts_items_catalyst_kind";
  DROP TYPE "payload"."enum_trade_sheets_blocks_desk_annotation_scope";
  DROP TYPE "payload"."enum_trade_sheets_citations_kind";
  DROP TYPE "payload"."enum_trade_sheets_source_mode";`)
}
