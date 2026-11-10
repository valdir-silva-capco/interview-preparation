import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service.js';
import { Company } from './company.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { Roles } from '../auth/auth.decorators.js';
import type { Request } from 'express';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas cadastradas' })
  @ApiOkResponse({ type: Company, isArray: true })
  findAll(@Req() request: Request): Promise<Company[]> {
    return this.companiesService.findAll(request.user!);
  }

  @Post()
  @Roles('root')
  @ApiOperation({ summary: 'Cadastrar uma empresa' })
  @ApiCreatedResponse({ type: Company })
  create(@Body() dto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(dto);
  }
}
