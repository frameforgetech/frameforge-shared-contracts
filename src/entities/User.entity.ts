import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_users_username')
  @IsString()
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must contain only alphanumeric characters and underscores',
  })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  passwordHash!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
