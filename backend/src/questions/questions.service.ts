import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import { Company } from '../companies/company.entity.js';
import { CompaniesService } from '../companies/companies.service.js';
import type { CreateQuestionDto } from './dto/create-question.dto.js';
import type { SetQuestionFavoriteDto } from './dto/set-question-favorite.dto.js';
import type { UpdateQuestionDto } from './dto/update-question.dto.js';
import { Question } from './question.entity.js';

const MAX_FAVORITE_QUESTIONS = 10;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly companiesService: CompaniesService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(companyId: string): Promise<Question[]> {
    await this.companiesService.findOne(companyId);
    return this.questionsRepository.find({
      where: { companyId },
      order: { isFavorite: 'DESC', updatedAt: 'DESC' },
    });
  }

  async findOne(companyId: string, id: string): Promise<Question> {
    const question = await this.questionsRepository.findOneBy({
      id,
      companyId,
    });
    if (!question) {
      throw new NotFoundException('Pergunta não encontrada.');
    }
    return question;
  }

  async create(companyId: string, dto: CreateQuestionDto): Promise<Question> {
    await this.companiesService.findOne(companyId);
    const question = this.questionsRepository.create({
      companyId,
      prompt: dto.prompt.trim(),
      answer: dto.answer?.trim() || null,
    });
    return this.questionsRepository.save(question);
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findOne(companyId, id);
    if (dto.prompt !== undefined) {
      question.prompt = dto.prompt.trim();
    }
    if (dto.answer !== undefined) {
      question.answer = dto.answer?.trim() || null;
    }
    return this.questionsRepository.save(question);
  }

  async setFavorite(
    companyId: string,
    id: string,
    dto: SetQuestionFavoriteDto,
  ): Promise<Question> {
    return this.dataSource.transaction(async (manager) => {
      const company = await manager
        .getRepository(Company)
        .createQueryBuilder('company')
        .setLock('pessimistic_write')
        .where('company.id = :companyId', { companyId })
        .getOne();
      if (!company) {
        throw new NotFoundException('Empresa não encontrada.');
      }

      const questions = manager.getRepository(Question);
      const question = await questions.findOneBy({ id, companyId });
      if (!question) {
        throw new NotFoundException('Pergunta não encontrada.');
      }

      if (dto.isFavorite && !question.isFavorite) {
        const favoriteCount = await questions.countBy({
          companyId,
          isFavorite: true,
        });
        if (favoriteCount >= MAX_FAVORITE_QUESTIONS) {
          throw new ConflictException(
            `É possível favoritar no máximo ${MAX_FAVORITE_QUESTIONS} perguntas por empresa.`,
          );
        }
      }

      question.isFavorite = dto.isFavorite;
      return questions.save(question);
    });
  }

  async remove(companyId: string, id: string): Promise<void> {
    const question = await this.findOne(companyId, id);
    await this.questionsRepository.remove(question);
  }
}
