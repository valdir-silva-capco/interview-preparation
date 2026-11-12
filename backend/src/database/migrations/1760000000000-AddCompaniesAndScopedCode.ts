import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompaniesAndScopedCode1760000000000 implements MigrationInterface {
  name = 'AddCompaniesAndScopedCode1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_companies_name_lower" ON "companies" (lower("name"))',
    );
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "companyId" uuid
    `);
    await queryRunner.query(`
      INSERT INTO "companies" ("name")
      SELECT 'Default Company'
      WHERE EXISTS (SELECT 1 FROM "questions")
    `);
    await queryRunner.query(`
      UPDATE "questions"
      SET "companyId" = (
        SELECT "id" FROM "companies" WHERE lower("name") = lower('Default Company')
      )
      WHERE "companyId" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      ALTER COLUMN "companyId" SET NOT NULL,
      ADD CONSTRAINT "FK_questions_company"
        FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_questions_company_updated" ON "questions" ("companyId", "updatedAt")',
    );
    await queryRunner.query(`
      CREATE TABLE "code_snippets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "companyId" uuid NOT NULL,
        "title" character varying(120) NOT NULL,
        "language" character varying(10) NOT NULL,
        "source" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_code_snippets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_code_snippets_company"
          FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_code_snippets_language"
          CHECK ("language" IN ('python', 'node'))
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_code_snippets_company_updated" ON "code_snippets" ("companyId", "updatedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "code_snippets"');
    await queryRunner.query('DROP INDEX "IDX_questions_company_updated"');
    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP CONSTRAINT "FK_questions_company",
      DROP COLUMN "companyId"
    `);
    await queryRunner.query('DROP INDEX "UQ_companies_name_lower"');
    await queryRunner.query('DROP TABLE "companies"');
  }
}
