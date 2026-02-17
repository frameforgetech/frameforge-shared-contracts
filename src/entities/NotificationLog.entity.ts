import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsEnum, IsEmail, IsInt, Min, IsOptional } from 'class-validator';
import { VideoJob } from './VideoJob.entity';

export enum NotificationType {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notification_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  notificationId!: string;

  @Column({ type: 'uuid' })
  @Index('idx_notifications_job_id')
  jobId!: string;

  @ManyToOne(() => VideoJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: VideoJob;

  @Column({
    type: 'varchar',
    length: 20,
  })
  @IsEnum(NotificationType, { message: 'Invalid notification type' })
  notificationType!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  @IsEmail({}, { message: 'Invalid recipient email address' })
  recipientEmail!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  @Index('idx_notifications_status')
  @IsEnum(DeliveryStatus, { message: 'Invalid delivery status' })
  deliveryStatus!: DeliveryStatus;

  @Column({ type: 'integer', default: 0 })
  @IsInt()
  @Min(0)
  retryCount!: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  sentAt?: Date;
}
