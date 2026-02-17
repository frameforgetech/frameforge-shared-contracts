import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { User } from './User.entity';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('video_jobs')
@Index('idx_jobs_user_status', ['userId', 'status'])
export class VideoJob {
  @PrimaryGeneratedColumn('uuid')
  jobId!: string;

  @Column({ type: 'uuid' })
  @Index('idx_jobs_user_id')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  filename!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  @Index('idx_jobs_status')
  @IsEnum(JobStatus, { message: 'Invalid job status' })
  status!: JobStatus;

  @Column({ type: 'text' })
  @IsString()
  videoUrl!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  resultUrl?: string;

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  frameCount?: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_jobs_created_at')
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  completedAt?: Date;
}
