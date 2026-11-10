import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateCompanyDto } from './dto/create-company.dto.js';
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
    const company = await this.companiesRepository.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }
    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const company = this.companiesRepository.create({
      name: dto.name.trim(),
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
        throw new ConflictException('Já existe uma empresa com esse nome.');
      }
      throw error;
    }
  }
}
