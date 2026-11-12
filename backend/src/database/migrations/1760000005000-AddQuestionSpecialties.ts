import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionSpecialties1760000005000 implements MigrationInterface {
  name = 'AddQuestionSpecialties1760000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "question_specialties" (
        "questionId" uuid NOT NULL,
        "specialtyId" uuid NOT NULL,
        CONSTRAINT "PK_question_specialties" PRIMARY KEY ("questionId", "specialtyId"),
        CONSTRAINT "FK_question_specialties_question" FOREIGN KEY ("questionId")
          REFERENCES "questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_question_specialties_specialty" FOREIGN KEY ("specialtyId")
          REFERENCES "technology_specialties"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_question_specialties_specialty" ON "question_specialties" ("specialtyId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_question_specialties_specialty"');
    await queryRunner.query('DROP TABLE "question_specialties"');
  }
}
