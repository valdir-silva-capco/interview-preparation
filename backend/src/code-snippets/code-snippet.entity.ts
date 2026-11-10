import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'code_snippets' })
@Index('IDX_code_snippets_company_updated', ['companyId', 'updatedAt'])
export class CodeSnippet {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  companyId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  createdById!: string | null;

  @ApiProperty({ maxLength: 120 })
  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @ApiProperty({ enum: ['python', 'node'] })
  @Column({ type: 'varchar', length: 10 })
  language!: 'python' | 'node';

  @ApiProperty({ maxLength: 20_000 })
  @Column({ type: 'text' })
  source!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
