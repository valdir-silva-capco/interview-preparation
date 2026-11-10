import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module.js';
import { CodeSnippet } from '../code-snippets/code-snippet.entity.js';
import { CodeExecutionController } from './code-execution.controller.js';
import { CodeRunnerClient } from './code-runner.client.js';
import { CodeSnippetsController } from './code-snippets.controller.js';
import { CodeSnippetsService } from './code-snippets.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CodeSnippet]), CompaniesModule],
  controllers: [CodeExecutionController, CodeSnippetsController],
  providers: [CodeRunnerClient, CodeSnippetsService],
})
export class CodeExecutionModule {}
