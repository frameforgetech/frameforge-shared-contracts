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
  @PrimaryGeneratedColumn('uuid', { name: 'job_id' })
  jobId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index('idx_jobs_user_id')
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
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

  @Column({ name: 'video_url', type: 'text' })
  @IsString()
  videoUrl!: string;

  @Column({ name: 'result_url', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  resultUrl?: string;

  @Column({ name: 'frame_count', type: 'integer', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  frameCount?: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  @Index('idx_jobs_created_at')
  createdAt!: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  @IsOptional()
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  @IsOptional()
  completedAt?: Date;
}
