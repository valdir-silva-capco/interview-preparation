import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';

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

  @ApiProperty({ format: 'uuid', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdById!: string | null;

  @ApiProperty({ default: false })
  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'integer', nullable: true })
  favoriteOrder!: number | null;

  @ApiPropertyOptional({ maxLength: 20_000, nullable: true })
  @Column({ type: 'text', nullable: true })
  answer!: string | null;

  @ApiProperty({ type: () => [TechnologySpecialty] })
  @ManyToMany(() => TechnologySpecialty)
  @JoinTable({
    name: 'question_specialties',
    joinColumn: { name: 'questionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'specialtyId', referencedColumnName: 'id' },
  })
  specialties!: TechnologySpecialty[];

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
