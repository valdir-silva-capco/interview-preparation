import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderFavoriteQuestionsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  questionIds!: string[];
}
