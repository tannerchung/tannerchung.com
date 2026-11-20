import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."trade_sheets" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"sheet_date" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"alert_banner" varchar,
  	"kpis_json" jsonb,
  	"strategy_json" jsonb,
  	"tickets_json" jsonb,
  	"checked_row_ids" jsonb,
  	"quotes_refreshed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "trade_sheets_id" uuid;
  CREATE UNIQUE INDEX "trade_sheets_sheet_date_idx" ON "payload"."trade_sheets" USING btree ("sheet_date");
  CREATE INDEX "trade_sheets_updated_at_idx" ON "payload"."trade_sheets" USING btree ("updated_at");
  CREATE INDEX "trade_sheets_created_at_idx" ON "payload"."trade_sheets" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trade_sheets_fk" FOREIGN KEY ("trade_sheets_id") REFERENCES "payload"."trade_sheets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trade_sheets_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("trade_sheets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."trade_sheets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."trade_sheets" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trade_sheets_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_trade_sheets_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "trade_sheets_id";`)
}
