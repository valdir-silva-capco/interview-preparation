import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateCodeSnippetDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ enum: ['python', 'node'] })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['python', 'node'])
  language?: 'python' | 'node';

  @ApiPropertyOptional({ maxLength: 20_000 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  source?: string;
}
