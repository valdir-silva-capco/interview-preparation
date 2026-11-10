import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionFavorites1760000001000 implements MigrationInterface {
  name = 'AddQuestionFavorites1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "isFavorite" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_questions_company_favorite_updated" ON "questions" ("companyId", "isFavorite", "updatedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_questions_company_favorite_updated"',
    );
    await queryRunner.query('ALTER TABLE "questions" DROP COLUMN "isFavorite"');
  }
}
