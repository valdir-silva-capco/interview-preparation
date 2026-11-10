import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { In } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { hashPassword } from '../auth/auth.service.js';
import { Company } from '../companies/company.entity.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';
import { User, type UserRole } from './user.entity.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(TechnologySpecialty)
    private readonly specialtiesRepository: Repository<TechnologySpecialty>,
  ) {}

  async findAll(actor: AuthenticatedUser): Promise<unknown[]> {
    const users = await this.usersRepository.find({
      relations: { companies: true, specialties: true },
      order: { name: 'ASC' },
    });
    const visibleUsers =
      actor.role === 'root'
        ? users
        : users.filter(
            (user) =>
              user.role !== 'root' &&
              user.companies.some((company) =>
                actor.companyIds.includes(company.id),
              ),
          );
    return visibleUsers.map((user) => this.toSafeUser(user));
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateUserDto,
  ): Promise<unknown> {
    if (actor.role === 'master' && dto.role !== 'user') {
      throw new ForbiddenException(
        'Masters can create user accounts only.',
      );
    }
    this.validateCompanyScope(actor, dto.companyIds);
    this.validateRootEmail(dto.email, dto.role);
    const [companies, specialties] = await Promise.all([
      this.loadCompanies(dto.companyIds),
      this.loadSpecialties(dto.specialtyIds ?? []),
    ]);
    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      passwordHash: await hashPassword(dto.password),
      role: dto.role,
      avatarUrl: dto.avatarUrl?.trim() || null,
      isActive: true,
      companies,
      specialties,
    });
    try {
      return this.toSafeUser(await this.usersRepository.save(user));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<unknown> {
    const user = await this.findOne(id);
    this.assertCanManage(actor, user);
    if (user.role === 'root') {
      throw new ForbiddenException('Root account settings cannot be changed here.');
    }
    if (
      actor.role === 'master' &&
      ((dto.role !== undefined && dto.role !== 'user') ||
        (dto.isActive === false && user.role !== 'user'))
    ) {
      throw new ForbiddenException('Masters can manage user accounts only.');
    }
    if (dto.companyIds) {
      this.validateCompanyScope(actor, dto.companyIds);
      user.companies = await this.loadCompanies(dto.companyIds);
    }
    if (dto.specialtyIds) {
      user.specialties = await this.loadSpecialties(dto.specialtyIds);
    }
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.email !== undefined) {
      this.validateRootEmail(dto.email, user.role);
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl?.trim() || null;
    if (dto.isActive !== undefined && dto.isActive !== user.isActive) {
      user.isActive = dto.isActive;
      user.tokenVersion += 1;
    }
    try {
      return this.toSafeUser(await this.usersRepository.save(user));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async deactivate(actor: AuthenticatedUser, id: string): Promise<void> {
    const user = await this.findOne(id);
    this.assertCanManage(actor, user);
    if (user.role === 'root' || user.id === actor.id) {
      throw new ForbiddenException(
        'The root account and your own account cannot be deactivated here.',
      );
    }
    if (actor.role === 'master' && user.role !== 'user') {
      throw new ForbiddenException('Masters can deactivate user accounts only.');
    }
    user.isActive = false;
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
  }

  async resetPassword(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<{ password: string }> {
    const user = await this.findOne(id);
    this.assertCanResetPassword(actor, user);

    const password = randomBytes(24).toString('base64url');
    user.passwordHash = await hashPassword(password);
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
    return { password };
  }

  private async findOne(id: string): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.tokenVersion')
      .leftJoinAndSelect('user.companies', 'company')
      .leftJoinAndSelect('user.specialties', 'specialty')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  private async loadCompanies(ids: string[]): Promise<Company[]> {
    const uniqueIds = [...new Set(ids)];
    const companies = await this.companiesRepository.findBy({
      id: In(uniqueIds),
    });
    if (companies.length !== uniqueIds.length) {
      throw new NotFoundException('One or more companies were not found.');
    }
    return companies;
  }

  private async loadSpecialties(
    ids: string[],
  ): Promise<TechnologySpecialty[]> {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return [];
    const specialties = await this.specialtiesRepository.findBy({
      id: In(uniqueIds),
    });
    if (specialties.length !== uniqueIds.length) {
      throw new NotFoundException('One or more technology specialties were not found.');
    }
    return specialties;
  }

  private validateCompanyScope(
    actor: AuthenticatedUser,
    companyIds: string[],
  ): void {
    if (
      actor.role !== 'root' &&
      companyIds.some((id) => !actor.companyIds.includes(id))
    ) {
      throw new ForbiddenException(
        'You can only manage users in companies you belong to.',
      );
    }
  }

  private validateRootEmail(email: string, role: UserRole): void {
    const rootEmail = (
      process.env.ROOT_EMAIL ?? 'valdir.silva@capco.com'
    ).toLowerCase();
    if (email.trim().toLowerCase() === rootEmail || role === 'root') {
      throw new ForbiddenException(
        'The root account can only be provisioned during initial setup.',
      );
    }
  }

  private assertCanManage(actor: AuthenticatedUser, user: User): void {
    if (actor.role === 'root') return;
    if (
      actor.role !== 'master' ||
      user.role !== 'user' ||
      !user.companies.some((company) => actor.companyIds.includes(company.id))
    ) {
      throw new ForbiddenException('You cannot manage this user.');
    }
  }

  private assertCanResetPassword(actor: AuthenticatedUser, user: User): void {
    if (actor.role === 'root' || actor.id === user.id) return;
    if (
      actor.role !== 'master' ||
      user.role !== 'user' ||
      !user.companies.some((company) => actor.companyIds.includes(company.id))
    ) {
      throw new ForbiddenException("You cannot reset this user's password.");
    }
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      companyIds: user.companies.map(({ id }) => id),
      companies: user.companies.map(({ id, name }) => ({ id, name })),
      specialties: user.specialties.map(({ id, name }) => ({ id, name })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
