import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(120)
  name!: string;
}
