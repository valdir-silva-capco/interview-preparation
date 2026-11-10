import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CodeSnippet } from '../code-snippets/code-snippet.entity.js';
import { SaveCodeSnippetDto } from '../code-snippets/dto/save-code-snippet.dto.js';
import { UpdateCodeSnippetDto } from '../code-snippets/dto/update-code-snippet.dto.js';
import { CodeSnippetsService } from './code-snippets.service.js';
import type { Request } from 'express';

@ApiTags('code-snippets')
@Controller('companies/:companyId/code-snippets')
export class CodeSnippetsController {
  constructor(private readonly snippetsService: CodeSnippetsService) {}

  @Get()
  @ApiOperation({ summary: 'List saved code snippets for a company' })
  @ApiOkResponse({ type: CodeSnippet, isArray: true })
  findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<CodeSnippet[]> {
    return this.snippetsService.findAll(companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Save a code snippet for a company' })
  @ApiCreatedResponse({ type: CodeSnippet })
  create(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: SaveCodeSnippetDto,
    @Req() request: Request,
  ): Promise<CodeSnippet> {
    this.validateSourceSize(dto.source);
    return this.snippetsService.create(companyId, dto, request.user!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved code snippet' })
  @ApiOkResponse({ type: CodeSnippet })
  update(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCodeSnippetDto,
    @Req() request: Request,
  ): Promise<CodeSnippet> {
    if (dto.source !== undefined) {
      this.validateSourceSize(dto.source);
    }
    return this.snippetsService.update(companyId, id, dto, request.user!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved code snippet' })
  @ApiNoContentResponse()
  async remove(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.snippetsService.remove(companyId, id, request.user!);
  }

  private validateSourceSize(source: string): void {
    if (Buffer.byteLength(source, 'utf8') > 20_000) {
      throw new BadRequestException(
        'Code must not exceed 20,000 bytes in UTF-8.',
      );
    }
  }
}
