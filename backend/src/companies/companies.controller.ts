import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
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
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'List registered companies' })
  @ApiOkResponse({ type: Company, isArray: true })
  findAll(@Req() request: Request): Promise<Company[]> {
    return this.companiesService.findAll(request.user!);
  }

  @Get('manage')
  @ApiOperation({ summary: 'List companies the current user can manage' })
  @ApiOkResponse({ type: Company, isArray: true })
  findManageable(@Req() request: Request): Promise<Company[]> {
    return this.companiesService.findManageable(request.user!);
  }

  @Post()
  @Roles('root')
  @ApiOperation({ summary: 'Create a company' })
  @ApiCreatedResponse({ type: Company })
  create(@Body() dto: CreateCompanyDto): Promise<Company> {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or deactivate a company' })
  @ApiOkResponse({ type: Company })
  update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(request.user!, id, dto);
  }
}
