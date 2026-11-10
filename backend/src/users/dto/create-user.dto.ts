import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(200)
  password!: string;

  @IsIn(['user', 'master'])
  role!: 'user' | 'master';

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  companyIds!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialtyIds?: string[];
}
