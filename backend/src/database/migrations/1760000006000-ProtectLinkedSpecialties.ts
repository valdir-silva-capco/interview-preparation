import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ProtectLinkedSpecialties1760000006000 implements MigrationInterface {
  name = 'ProtectLinkedSpecialties1760000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "question_specialties"
      DROP CONSTRAINT "FK_question_specialties_specialty",
      ADD CONSTRAINT "FK_question_specialties_specialty"
        FOREIGN KEY ("specialtyId")
        REFERENCES "technology_specialties"("id")
        ON DELETE RESTRICT
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_user_specialties_specialty" ON "user_specialties" ("specialtyId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_user_specialties_specialty"');
    await queryRunner.query(`
      ALTER TABLE "question_specialties"
      DROP CONSTRAINT "FK_question_specialties_specialty",
      ADD CONSTRAINT "FK_question_specialties_specialty"
        FOREIGN KEY ("specialtyId")
        REFERENCES "technology_specialties"("id")
        ON DELETE CASCADE
    `);
  }
}
