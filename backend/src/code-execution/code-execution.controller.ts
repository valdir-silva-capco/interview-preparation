import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from '../companies/companies.service.js';
import { CodeRunnerClient } from './code-runner.client.js';
import type { ExecutionResult } from './code-runner.client.js';
import { ExecuteCodeDto } from './dto/execute-code.dto.js';

@ApiTags('code-execution')
@Controller('companies/:companyId/code')
export class CodeExecutionController {
  constructor(
    private readonly codeRunnerClient: CodeRunnerClient,
    private readonly companiesService: CompaniesService,
  ) {}

  @Post('run')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Run a short Python or Node.js snippet' })
  @ApiOkResponse()
  async execute(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: ExecuteCodeDto,
  ): Promise<ExecutionResult> {
    if (Buffer.byteLength(input.source, 'utf8') > 20_000) {
      throw new BadRequestException(
        'Code must not exceed 20,000 bytes in UTF-8.',
      );
    }
    await this.companiesService.findOne(companyId);
    return this.codeRunnerClient.execute(input);
  }
}
