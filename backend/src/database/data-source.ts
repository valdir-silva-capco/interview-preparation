import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Company } from '../companies/company.entity.js';
import { CodeSnippet } from '../code-snippets/code-snippet.entity.js';
import { AddCompaniesAndScopedCode1760000000000 } from './migrations/1760000000000-AddCompaniesAndScopedCode.js';
import { AddQuestionFavorites1760000001000 } from './migrations/1760000001000-AddQuestionFavorites.js';
import { CreateQuestions1750000000000 } from './migrations/1750000000000-CreateQuestions.js';
import { Question } from '../questions/question.entity.js';
import { User } from '../users/user.entity.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';
import { AddAuthenticationAndOwnership1760000002000 } from './migrations/1760000002000-AddAuthenticationAndOwnership.js';
import { AddCompanyActivation1760000003000 } from './migrations/1760000003000-AddCompanyActivation.js';
import { TranslateDefaultCompanyName1760000004000 } from './migrations/1760000004000-TranslateDefaultCompanyName.js';
import { AddQuestionSpecialties1760000005000 } from './migrations/1760000005000-AddQuestionSpecialties.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'interview_app',
  password: process.env.DATABASE_PASSWORD ?? 'local_dev_only_change_me',
  database: process.env.DATABASE_NAME ?? 'interview_preparation',
  entities: [Company, Question, CodeSnippet, User, TechnologySpecialty],
  migrations: [
    CreateQuestions1750000000000,
    AddCompaniesAndScopedCode1760000000000,
    AddQuestionFavorites1760000001000,
    AddAuthenticationAndOwnership1760000002000,
    AddCompanyActivation1760000003000,
    TranslateDefaultCompanyName1760000004000,
    AddQuestionSpecialties1760000005000,
  ],
  synchronize: false,
});
