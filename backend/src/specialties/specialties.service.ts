import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { SaveSpecialtyDto } from './dto/save-specialty.dto.js';
import { TechnologySpecialty } from './technology-specialty.entity.js';

@Injectable()
export class SpecialtiesService {
  constructor(
    @InjectRepository(TechnologySpecialty)
    private readonly specialtiesRepository: Repository<TechnologySpecialty>,
  ) {}

  findAll(): Promise<TechnologySpecialty[]> {
    return this.specialtiesRepository.find({ order: { name: 'ASC' } });
  }

  async create(dto: SaveSpecialtyDto): Promise<TechnologySpecialty> {
    return this.saveName(this.specialtiesRepository.create({ name: dto.name.trim() }));
  }

  async update(
    id: string,
    dto: SaveSpecialtyDto,
  ): Promise<TechnologySpecialty> {
    const specialty = await this.specialtiesRepository.findOneBy({ id });
    if (!specialty) throw new NotFoundException('Technology specialty not found.');
    specialty.name = dto.name.trim();
    return this.saveName(specialty);
  }

  async remove(id: string): Promise<void> {
    const specialty = await this.specialtiesRepository.findOneBy({ id });
    if (!specialty) throw new NotFoundException('Technology specialty not found.');
    await this.specialtiesRepository.remove(specialty);
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
