import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import { verifyAccessToken } from './token.js';
import type { AuthenticatedUser } from './auth.types.js';
import { User, type UserRole } from '../users/user.entity.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Authentication required.');

    const payload = verifyAccessToken(token);
    if (!payload) throw new UnauthorizedException('Invalid or expired token.');

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.tokenVersion')
      .leftJoinAndSelect('user.companies', 'company')
      .leftJoinAndSelect('user.specialties', 'specialty')
      .where('user.id = :id', { id: payload.sub })
      .getOne();
    if (
      !user ||
      !user.isActive ||
      user.tokenVersion !== payload.ver
    ) {
      throw new UnauthorizedException('Account is inactive or session ended.');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      companyIds: user.companies.map(({ id }) => id),
      specialties: user.specialties.map(({ id, name }) => ({ id, name })),
      tokenVersion: user.tokenVersion,
    };
    request.user = authenticatedUser;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles && !requiredRoles.includes(authenticatedUser.role)) {
      throw new ForbiddenException('You do not have permission for this action.');
    }

    const companyId = request.params.companyId;
    if (
      typeof companyId === 'string' &&
      authenticatedUser.role !== 'root' &&
      !authenticatedUser.companyIds.includes(companyId)
    ) {
      throw new ForbiddenException(
        'You do not have access to this company.',
      );
    }

    return true;
  }
}
