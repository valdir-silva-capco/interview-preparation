import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, type Repository } from 'typeorm';
import { Company } from '../companies/company.entity.js';
import { CompaniesService } from '../companies/companies.service.js';
import type { CreateQuestionDto } from './dto/create-question.dto.js';
import type { SetQuestionFavoriteDto } from './dto/set-question-favorite.dto.js';
import type { UpdateQuestionDto } from './dto/update-question.dto.js';
import { Question } from './question.entity.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';

const MAX_FAVORITE_QUESTIONS = 12;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(TechnologySpecialty)
    private readonly specialtiesRepository: Repository<TechnologySpecialty>,
    private readonly companiesService: CompaniesService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(companyId: string): Promise<Question[]> {
    await this.companiesService.findOne(companyId);
    return this.questionsRepository.find({
      where: { companyId },
      order: { isFavorite: 'DESC', favoriteOrder: 'ASC', updatedAt: 'DESC' },
      relations: { specialties: true },
    });
  }

  async findOne(companyId: string, id: string): Promise<Question> {
    await this.companiesService.findOne(companyId);
    const question = await this.questionsRepository.findOne({
      where: { id, companyId },
      relations: { specialties: true },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    return question;
  }

  async create(
    companyId: string,
    dto: CreateQuestionDto,
    actor: AuthenticatedUser,
  ): Promise<Question> {
    await this.companiesService.findOne(companyId);
    const question = this.questionsRepository.create({
      companyId,
      createdById: actor.id,
      prompt: dto.prompt.trim(),
      answer: dto.answer?.trim() || null,
      specialties: await this.resolveSpecialties(dto.specialtyIds ?? []),
    });
    return this.questionsRepository.save(question);
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateQuestionDto,
    actor: AuthenticatedUser,
  ): Promise<Question> {
    const question = await this.findOne(companyId, id);
    this.assertCanEdit(actor, question.createdById);
    if (dto.prompt !== undefined) {
      question.prompt = dto.prompt.trim();
    }
    if (dto.answer !== undefined) {
      question.answer = dto.answer?.trim() || null;
    }
    if (dto.specialtyIds !== undefined) {
      question.specialties = await this.resolveSpecialties(dto.specialtyIds);
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
        .andWhere('company."isActive" = true')
        .getOne();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }

      const questions = manager.getRepository(Question);
      const question = await questions.findOne({
        where: { id, companyId },
        relations: { specialties: true },
      });
      if (!question) {
        throw new NotFoundException('Question not found.');
      }

      if (dto.isFavorite && !question.isFavorite) {
        const favorites = await questions.find({
          where: { companyId, isFavorite: true },
          order: { favoriteOrder: 'DESC' },
          take: 1,
        });
        const favoriteCount = await questions.countBy({
          companyId,
          isFavorite: true,
        });
        if (favoriteCount >= MAX_FAVORITE_QUESTIONS) {
          throw new ConflictException(
            `You can favorite up to ${MAX_FAVORITE_QUESTIONS} questions per company.`,
          );
        }
        question.favoriteOrder = (favorites[0]?.favoriteOrder ?? -1) + 1;
      } else if (!dto.isFavorite) {
        question.favoriteOrder = null;
      }

      question.isFavorite = dto.isFavorite;
      return questions.save(question);
    });
  }

  async reorderFavorites(
    companyId: string,
    questionIds: string[],
  ): Promise<Question[]> {
    return this.dataSource.transaction(async (manager) => {
      const company = await manager
        .getRepository(Company)
        .createQueryBuilder('company')
        .setLock('pessimistic_write')
        .where('company.id = :companyId', { companyId })
        .andWhere('company."isActive" = true')
        .getOne();
      if (!company) {
        throw new NotFoundException('Company not found.');
      }

      const questions = manager.getRepository(Question);
      const favorites = await questions.find({
        where: { companyId, isFavorite: true },
        order: { favoriteOrder: 'ASC', updatedAt: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        questionIds.length !== favorites.length ||
        new Set(questionIds).size !== questionIds.length ||
        favorites.some((question) => !questionIds.includes(question.id))
      ) {
        throw new BadRequestException(
          'The order must include every favorite question exactly once.',
        );
      }

      const favoritesById = new Map(
        favorites.map((question) => [question.id, question]),
      );
      const reordered = questionIds.map((id, index) => {
        const question = favoritesById.get(id)!;
        question.favoriteOrder = index;
        return question;
      });
      return questions.save(reordered);
    });
  }

  async remove(
    companyId: string,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const question = await this.findOne(companyId, id);
    this.assertCanEdit(actor, question.createdById);
    await this.questionsRepository.remove(question);
  }

  private assertCanEdit(
    actor: AuthenticatedUser,
    createdById: string | null,
  ): void {
    if (
      actor.role !== 'root' &&
      actor.role !== 'master' &&
      createdById !== actor.id
    ) {
      throw new NotFoundException('Question not found.');
    }
  }

  private async resolveSpecialties(
    specialtyIds: string[],
  ): Promise<TechnologySpecialty[]> {
    if (specialtyIds.length === 0) return [];
    const specialties = await this.specialtiesRepository.findBy({
      id: In(specialtyIds),
    });
    if (specialties.length !== specialtyIds.length) {
      throw new BadRequestException(
        'One or more selected specialties could not be found.',
      );
    }
    return specialties;
  }
}
