import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
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
}
