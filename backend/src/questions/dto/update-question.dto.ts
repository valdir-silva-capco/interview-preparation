import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ maxLength: 10_000 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(10_000)
  prompt?: string;

  @ApiPropertyOptional({ maxLength: 20_000 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(20_000)
  answer?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  specialtyIds?: string[];
}
