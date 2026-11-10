import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/company.entity.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, TechnologySpecialty]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
