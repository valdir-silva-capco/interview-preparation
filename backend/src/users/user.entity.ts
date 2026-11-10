import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity.js';
import { TechnologySpecialty } from '../specialties/technology-specialty.entity.js';

export type UserRole = 'user' | 'master' | 'root';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ type: 'text', select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'integer', default: 0, select: false })
  tokenVersion!: number;

  @ManyToMany(() => Company)
  @JoinTable({
    name: 'user_companies',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' },
  })
  companies!: Company[];

  @ManyToMany(() => TechnologySpecialty)
  @JoinTable({
    name: 'user_specialties',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'specialtyId',
      referencedColumnName: 'id',
    },
  })
  specialties!: TechnologySpecialty[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
