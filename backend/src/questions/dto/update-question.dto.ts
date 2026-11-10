import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
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

  @ApiPropertyOptional({ maxLength: 20_000, nullable: true })
  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsString()
  @MaxLength(20_000)
  answer?: string | null;
}
