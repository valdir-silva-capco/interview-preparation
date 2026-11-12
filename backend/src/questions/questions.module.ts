import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module.js';
import { Question } from './question.entity.js';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, TechnologySpecialty]),
    CompaniesModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
