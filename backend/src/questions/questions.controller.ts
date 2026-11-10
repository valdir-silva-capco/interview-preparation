import {
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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { SetQuestionFavoriteDto } from './dto/set-question-favorite.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { Question } from './question.entity.js';
import { QuestionsService } from './questions.service.js';

@ApiTags('questions')
@Controller('companies/:companyId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar perguntas' })
  @ApiOkResponse({ type: Question, isArray: true })
  findAll(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<Question[]> {
    return this.questionsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar uma pergunta' })
  @ApiOkResponse({ type: Question })
  findOne(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Question> {
    return this.questionsService.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar uma pergunta' })
  @ApiCreatedResponse({ type: Question })
  create(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma pergunta' })
  @ApiOkResponse({ type: Question })
  update(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.update(companyId, id, dto);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Favoritar ou desfavoritar uma pergunta' })
  @ApiOkResponse({ type: Question })
  setFavorite(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetQuestionFavoriteDto,
  ): Promise<Question> {
    return this.questionsService.setFavorite(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir uma pergunta' })
  @ApiNoContentResponse()
  async remove(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.questionsService.remove(companyId, id);
  }
}
