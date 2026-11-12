import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyActivation1760000003000
  implements MigrationInterface
{
  name = 'AddCompanyActivation1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
      DROP COLUMN "isActive"
    `);
  }
}
