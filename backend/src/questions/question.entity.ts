import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity({ name: 'questions' })
export class Question {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ maxLength: 10_000 })
  @Column({ type: 'text' })
  prompt!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  companyId!: string;

  @ApiProperty({ default: false })
  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @ApiPropertyOptional({ maxLength: 20_000, nullable: true })
  @Column({ type: 'text', nullable: true })
  answer!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
