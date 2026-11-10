import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import type { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { AuthenticatedUser } from './auth.types.js';
import { createAccessToken } from './token.js';

function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options?: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options ?? {}, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: Omit<AuthenticatedUser, 'tokenVersion'>;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.tokenVersion'])
      .leftJoinAndSelect('user.companies', 'company')
      .leftJoinAndSelect('user.specialties', 'specialty')
      .where('lower(user.email) = lower(:email)', { email: email.trim() })
      .getOne();

    if (
      !user ||
      !user.isActive ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return {
      accessToken: createAccessToken(user.id, user.tokenVersion),
      expiresIn: 20 * 60 * 60,
      user: this.toSafeUser(user),
    };
  }

  toSafeUser(user: User): Omit<AuthenticatedUser, 'tokenVersion'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      companyIds: user.companies.map(({ id }) => id),
      specialties: user.specialties.map(({ id, name }) => ({ id, name })),
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (newPassword.length < 12) {
      throw new BadRequestException(
        'The new password must be at least 12 characters long.',
      );
    }
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.tokenVersion'])
      .where('user.id = :userId', { userId })
      .getOneOrFail();
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    user.passwordHash = await hashPassword(newPassword);
    user.tokenVersion += 1;
    await this.usersRepository.save(user);
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, n, r, p, saltValue, expectedValue] = storedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    !n ||
    !r ||
    !p ||
    !saltValue ||
    !expectedValue
  ) {
    return false;
  }
  const expected = Buffer.from(expectedValue, 'base64url');
  const actual = await scrypt(
    password,
    Buffer.from(saltValue, 'base64url'),
    expected.length,
    { N: Number(n), r: Number(r), p: Number(p) },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
