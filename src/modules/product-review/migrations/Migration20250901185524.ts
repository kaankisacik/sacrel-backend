import { Migration } from '@mikro-orm/migrations';

export class Migration20250901185524 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_review" ("id" text not null, "customer_id" text not null, "product_id" text not null, "order_id" text not null, "rating" integer not null, "title" text null, "comment" text null, "is_verified_purchase" boolean not null default true, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "helpful_count" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_deleted_at" ON "product_review" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_review" cascade;`);
  }

}
