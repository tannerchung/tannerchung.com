import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."payload_mcp_api_keys" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"projects_find" boolean DEFAULT false,
  	"projects_create" boolean DEFAULT false,
  	"projects_update" boolean DEFAULT false,
  	"projects_delete" boolean DEFAULT false,
  	"posts_find" boolean DEFAULT false,
  	"posts_create" boolean DEFAULT false,
  	"posts_update" boolean DEFAULT false,
  	"posts_delete" boolean DEFAULT false,
  	"experiments_find" boolean DEFAULT false,
  	"experiments_create" boolean DEFAULT false,
  	"experiments_update" boolean DEFAULT false,
  	"experiments_delete" boolean DEFAULT false,
  	"trade_notes_find" boolean DEFAULT false,
  	"trade_notes_create" boolean DEFAULT false,
  	"trade_notes_update" boolean DEFAULT false,
  	"trade_notes_delete" boolean DEFAULT false,
  	"trade_sheets_find" boolean DEFAULT false,
  	"trade_sheets_create" boolean DEFAULT false,
  	"trade_sheets_update" boolean DEFAULT false,
  	"trade_sheets_delete" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" uuid;
  ALTER TABLE "payload"."payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" uuid;
  ALTER TABLE "payload"."payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload"."payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload"."payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload"."payload_mcp_api_keys" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "payload"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "payload"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload"."payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  ALTER TABLE "payload"."payload_mcp_api_keys" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_mcp_api_keys" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."payload_mcp_api_keys" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";
  
  ALTER TABLE "payload"."payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
  DROP INDEX "payload"."payload_preferences_rels_payload_mcp_api_keys_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
  ALTER TABLE "payload"."payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";`)
}
