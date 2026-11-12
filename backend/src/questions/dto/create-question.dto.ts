import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ maxLength: 10_000 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(10_000)
  prompt!: string;

  @ApiPropertyOptional({ maxLength: 20_000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  answer?: string | null;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  specialtyIds?: string[];
}
