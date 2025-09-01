import { Migration } from '@mikro-orm/migrations';

export class Migration20250901194727 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_review" drop column if exists "order_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_review" add column if not exists "order_id" text not null;`);
  }

}
