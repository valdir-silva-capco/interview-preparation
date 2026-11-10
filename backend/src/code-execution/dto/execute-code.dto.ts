import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ExecuteCodeDto {
  @ApiProperty({ enum: ['python', 'node'] })
  @IsIn(['python', 'node'])
  language!: 'python' | 'node';

  @ApiProperty({ maxLength: 20_000 })
  @IsString()
  @MinLength(1)
  @MaxLength(20_000)
  source!: string;
}
