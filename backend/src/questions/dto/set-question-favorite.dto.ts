import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetQuestionFavoriteDto {
  @ApiProperty()
  @IsBoolean()
  isFavorite!: boolean;
}
