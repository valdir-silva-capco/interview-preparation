import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeExecutionModule } from './code-execution/code-execution.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { HealthModule } from './health/health.module.js';
import { QuestionsModule } from './questions/questions.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { UsersModule } from './users/users.module.js';
import { SpecialtiesModule } from './specialties/specialties.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '5432')),
        username: config.get<string>('DATABASE_USER', 'interview_app'),
        password: config.get<string>(
          'DATABASE_PASSWORD',
          'local_dev_only_change_me',
        ),
        database: config.get<string>('DATABASE_NAME', 'interview_preparation'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    CompaniesModule,
    QuestionsModule,
    CodeExecutionModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SpecialtiesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: AuthGuard },
  ],
})
export class AppModule {}
