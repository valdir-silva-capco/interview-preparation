import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFavoriteQuestionOrder1760000007000 implements MigrationInterface {
  name = 'AddFavoriteQuestionOrder1760000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "favoriteOrder" integer
    `);
    await queryRunner.query(`
      WITH ranked_favorites AS (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "companyId"
            ORDER BY "updatedAt" DESC, "id"
          ) - 1 AS position
        FROM "questions"
        WHERE "isFavorite" = true
      )
      UPDATE "questions" AS question
      SET "favoriteOrder" = ranked_favorites.position
      FROM ranked_favorites
      WHERE question."id" = ranked_favorites."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP COLUMN "favoriteOrder"
    `);
  }
}
