import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import type { SaveSpecialtyDto } from './dto/save-specialty.dto.js';
import { TechnologySpecialty } from './technology-specialty.entity.js';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(TechnologySpecialty)
    private readonly specialtiesRepository: Repository<TechnologySpecialty>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<TechnologySpecialty[]> {
    return this.specialtiesRepository.find({ order: { name: 'ASC' } });
  }

  async create(dto: SaveSpecialtyDto): Promise<TechnologySpecialty> {
    const name = dto.name.trim();
    await this.assertNameAvailable(name);
    return this.saveName(this.specialtiesRepository.create({ name }));
  }

  async update(
    id: string,
    dto: SaveSpecialtyDto,
  ): Promise<TechnologySpecialty> {
    const specialty = await this.specialtiesRepository.findOneBy({ id });
    if (!specialty)
      throw new NotFoundException('Technology specialty not found.');
    const name = dto.name.trim();
    await this.assertNameAvailable(name, id);
    specialty.name = name;
    return this.saveName(specialty);
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const specialty = await manager
        .getRepository(TechnologySpecialty)
        .findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
      if (!specialty) {
        throw new NotFoundException('Technology specialty not found.');
      }

      const [userLinks, questionLinks] = await Promise.all([
        manager.query(
          'SELECT 1 FROM "user_specialties" WHERE "specialtyId" = $1 LIMIT 1',
          [id],
        ),
        manager.query(
          'SELECT 1 FROM "question_specialties" WHERE "specialtyId" = $1 LIMIT 1',
          [id],
        ),
      ]);
      if (userLinks.length > 0 || questionLinks.length > 0) {
        throw new ConflictException(
          'Cannot delete a specialty assigned to users or questions.',
        );
      }

      await manager.getRepository(TechnologySpecialty).remove(specialty);
    });
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const query = this.specialtiesRepository
      .createQueryBuilder('specialty')
      .where('LOWER(specialty.name) = LOWER(:name)', { name });
    if (excludeId) {
      query.andWhere('specialty.id != :excludeId', { excludeId });
    }
    if (await query.getExists()) {
      throw new ConflictException(
        'A technology specialty with this name already exists.',
      );
    }
  }

  private async saveName(
    specialty: TechnologySpecialty,
  ): Promise<TechnologySpecialty> {
    try {
      return await this.specialtiesRepository.save(specialty);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException(
          'A technology specialty with this name already exists.',
        );
      }
      throw error;
    }
  }
}
