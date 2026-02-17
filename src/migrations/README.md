# Database Migrations

This directory contains TypeORM migration files for the FrameForge video processing system database schema.

## Migrations

### 1700000001000-CreateUsersTable.ts
Creates the `users` table with the following structure:
- Primary key: `userId` (UUID)
- Columns: `username`, `email`, `passwordHash`, `createdAt`, `updatedAt`
- Indexes: `idx_users_username`, `idx_users_email`
- Constraints: Unique constraints on `username` and `email`

### 1700000002000-CreateVideoJobsTable.ts
Creates the `video_jobs` table with the following structure:
- Primary key: `jobId` (UUID)
- Columns: `userId`, `filename`, `status`, `videoUrl`, `resultUrl`, `frameCount`, `errorMessage`, `createdAt`, `startedAt`, `completedAt`
- Indexes: `idx_jobs_user_id`, `idx_jobs_status`, `idx_jobs_created_at`, `idx_jobs_user_status`
- Foreign key: `userId` references `users(userId)` with CASCADE delete
- Check constraint: `status` must be one of ('pending', 'processing', 'completed', 'failed')

### 1700000003000-CreateNotificationLogTable.ts
Creates the `notification_log` table with the following structure:
- Primary key: `notificationId` (UUID)
- Columns: `jobId`, `notificationType`, `recipientEmail`, `deliveryStatus`, `retryCount`, `errorMessage`, `createdAt`, `sentAt`
- Indexes: `idx_notifications_job_id`, `idx_notifications_status`
- Foreign key: `jobId` references `video_jobs(jobId)` with CASCADE delete
- Check constraints:
  - `notificationType` must be one of ('success', 'failure')
  - `deliveryStatus` must be one of ('pending', 'sent', 'failed')

## Running Migrations

To run these migrations, configure TypeORM in your application with the following settings:

```typescript
import { DataSource } from 'typeorm';
import * as migrations from '@frameforge/shared-types';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [/* your entities */],
  migrations: [
    migrations.CreateUsersTable1700000001000,
    migrations.CreateVideoJobsTable1700000002000,
    migrations.CreateNotificationLogTable1700000003000,
  ],
  synchronize: false, // Always use migrations in production
  logging: true,
});

// Initialize and run migrations
await dataSource.initialize();
await dataSource.runMigrations();
```

Or use the TypeORM CLI:

```bash
# Run all pending migrations
npx typeorm migration:run -d path/to/datasource.ts

# Revert the last migration
npx typeorm migration:revert -d path/to/datasource.ts

# Show migration status
npx typeorm migration:show -d path/to/datasource.ts
```

## Migration Order

The migrations must be run in the following order due to foreign key dependencies:
1. CreateUsersTable (no dependencies)
2. CreateVideoJobsTable (depends on users)
3. CreateNotificationLogTable (depends on video_jobs)

## Requirements Validation

These migrations satisfy the following requirements from the design document:
- **Requirement 7.1**: Database stores user accounts, video job records, and processing metadata
- **Requirement 7.2**: Job creation is atomic through database transactions
- **Requirement 7.3**: Foreign key constraints between users and video jobs are enforced
