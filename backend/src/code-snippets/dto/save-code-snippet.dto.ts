import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SaveCodeSnippetDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ enum: ['python', 'node'] })
  @IsIn(['python', 'node'])
  language!: 'python' | 'node';

  @ApiProperty({ maxLength: 20_000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  source!: string;
}
