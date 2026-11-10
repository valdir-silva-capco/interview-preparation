import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuestions1750000000000 implements MigrationInterface {
  name = 'CreateQuestions1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "prompt" text NOT NULL,
        "answer" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_questions_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "questions"');
  }
}
