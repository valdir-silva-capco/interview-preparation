import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthenticationAndOwnership1760000002000
  implements MigrationInterface
{
  name = 'AddAuthenticationAndOwnership1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "email" character varying(320) NOT NULL,
        "passwordHash" text NOT NULL,
        "role" character varying(20) NOT NULL,
        "avatarUrl" character varying(2048),
        "isActive" boolean NOT NULL DEFAULT true,
        "tokenVersion" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('user', 'master', 'root'))
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_users_email_lower" ON "users" (lower("email"))',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_users_single_root" ON "users" ("role") WHERE "role" = \'root\'',
    );
    await queryRunner.query(`
      CREATE TABLE "technology_specialties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(80) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_technology_specialties_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_technology_specialties_name_lower" ON "technology_specialties" (lower("name"))',
    );
    await queryRunner.query(`
      CREATE TABLE "user_companies" (
        "userId" uuid NOT NULL,
        "companyId" uuid NOT NULL,
        CONSTRAINT "PK_user_companies" PRIMARY KEY ("userId", "companyId"),
        CONSTRAINT "FK_user_companies_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_companies_company" FOREIGN KEY ("companyId")
          REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_user_companies_company" ON "user_companies" ("companyId")',
    );
    await queryRunner.query(`
      CREATE TABLE "user_specialties" (
        "userId" uuid NOT NULL,
        "specialtyId" uuid NOT NULL,
        CONSTRAINT "PK_user_specialties" PRIMARY KEY ("userId", "specialtyId"),
        CONSTRAINT "FK_user_specialties_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_specialties_specialty" FOREIGN KEY ("specialtyId")
          REFERENCES "technology_specialties"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "createdById" uuid,
      ADD CONSTRAINT "FK_questions_creator" FOREIGN KEY ("createdById")
        REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "code_snippets"
      ADD COLUMN "createdById" uuid,
      ADD CONSTRAINT "FK_code_snippets_creator" FOREIGN KEY ("createdById")
        REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "code_snippets"
      DROP CONSTRAINT "FK_code_snippets_creator",
      DROP COLUMN "createdById"
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP CONSTRAINT "FK_questions_creator",
      DROP COLUMN "createdById"
    `);
    await queryRunner.query('DROP TABLE "user_specialties"');
    await queryRunner.query('DROP INDEX "IDX_user_companies_company"');
    await queryRunner.query('DROP TABLE "user_companies"');
    await queryRunner.query('DROP INDEX "UQ_technology_specialties_name_lower"');
    await queryRunner.query('DROP TABLE "technology_specialties"');
    await queryRunner.query('DROP INDEX "UQ_users_single_root"');
    await queryRunner.query('DROP INDEX "UQ_users_email_lower"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
