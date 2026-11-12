import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TranslateDefaultCompanyName1760000004000
  implements MigrationInterface
{
  name = 'TranslateDefaultCompanyName1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "companies"
      SET "name" = 'Default Company'
      WHERE "name" = 'Empresa padrão'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "companies"
      SET "name" = 'Empresa padrão'
      WHERE "name" = 'Default Company'
    `);
  }
}
