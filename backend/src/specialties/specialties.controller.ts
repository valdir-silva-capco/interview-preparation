import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators.js';
import { SaveSpecialtyDto } from './dto/save-specialty.dto.js';
import { SpecialtiesService } from './specialties.service.js';

@ApiTags('technology-specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'List technology specialties' })
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Post()
  @Roles('root')
  @ApiOperation({ summary: 'Create a technology specialty' })
  create(@Body() dto: SaveSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Patch(':id')
  @Roles('root')
  @ApiOperation({ summary: 'Update a technology specialty' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSpecialtyDto,
  ) {
    return this.specialtiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('root')
  @ApiOperation({ summary: 'Delete a technology specialty' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialtiesService.remove(id);
  }
}
