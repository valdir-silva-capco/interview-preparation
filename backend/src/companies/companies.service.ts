import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateCompanyDto } from './dto/create-company.dto.js';
import type { UpdateCompanyDto } from './dto/update-company.dto.js';
import { Company } from './company.entity.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  async findAll(actor: AuthenticatedUser): Promise<Company[]> {
    if (actor.role === 'root') {
      return this.companiesRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }
    return this.companiesRepository
      .createQueryBuilder('company')
      .innerJoin(
        'user_companies',
        'membership',
        'membership."companyId" = company.id',
      )
      .where('membership."userId" = :userId', { userId: actor.id })
      .andWhere('company."isActive" = true')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  async findManageable(actor: AuthenticatedUser): Promise<Company[]> {
    if (actor.role === 'root') {
      return this.companiesRepository.find({ order: { name: 'ASC' } });
    }
    return this.companiesRepository
      .createQueryBuilder('company')
      .innerJoin(
        'user_companies',
        'membership',
        'membership."companyId" = company.id',
      )
      .where('membership."userId" = :userId', { userId: actor.id })
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({
      id,
      isActive: true,
    });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }
    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const company = this.companiesRepository.create({
      name: dto.name.trim(),
      isActive: true,
    });
    try {
      return await this.companiesRepository.save(company);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('A company with this name already exists.');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) throw new NotFoundException('Company not found.');
    if (
      actor.role !== 'root' &&
      !actor.companyIds.includes(company.id)
    ) {
      throw new NotFoundException('Company not found.');
    }
    if (dto.name === undefined && dto.isActive === undefined) {
      throw new BadRequestException(
        'Provide a company name or active status to update.',
      );
    }
    if (dto.name !== undefined) company.name = dto.name.trim();
    if (dto.isActive !== undefined) company.isActive = dto.isActive;
    try {
      return await this.companiesRepository.save(company);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A company with this name already exists.');
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
