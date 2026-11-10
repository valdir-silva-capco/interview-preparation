import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/auth.decorators.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
@Roles('root', 'master')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users available to the current administrator' })
  findAll(@Req() request: Request) {
    return this.usersService.findAll(request.user!);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user account' })
  create(@Req() request: Request, @Body() dto: CreateUserDto) {
    return this.usersService.create(request.user!, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user account' })
  update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(request.user!, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a user account' })
  deactivate(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.usersService.deactivate(request.user!, id);
  }

  @Post(':id/reset-password')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Generate a one-time temporary password' })
  resetPassword(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ password: string }> {
    return this.usersService.resetPassword(request.user!, id);
  }
}
