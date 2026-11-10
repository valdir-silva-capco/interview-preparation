import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service.js';
import { Company } from './company.entity.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas cadastradas' })
  @ApiOkResponse({ type: Company, isArray: true })
  findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar uma empresa' })
  @ApiCreatedResponse({ type: Company })
  create(@Body() dto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(dto);
  }
}
