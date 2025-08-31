import { Migration } from '@mikro-orm/migrations';

export class Migration20250831180559 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ui_media" ("id" text not null, "type" text check ("type" in ('carousel', 'banner')) not null, "title" text null, "image_url" text not null, "link_url" text null, "sort_order" integer not null default 0, "is_active" boolean not null default true, "locale" text not null default 'tr', "publish_at" timestamptz null, "unpublish_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ui_media_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ui_media_deleted_at" ON "ui_media" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ui_media_type" ON "ui_media" (type) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ui_media_active" ON "ui_media" (is_active) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "idx_ui_media_sort" ON "ui_media" (type, sort_order) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ui_media" cascade;`);
  }

}
