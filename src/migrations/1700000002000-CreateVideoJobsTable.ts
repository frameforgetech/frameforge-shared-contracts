import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateVideoJobsTable1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'video_jobs',
        columns: [
          {
            name: 'jobId',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'videoUrl',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'resultUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'frameCount',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add CHECK constraint for status
    await queryRunner.query(
      `ALTER TABLE video_jobs ADD CONSTRAINT chk_video_jobs_status 
       CHECK (status IN ('pending', 'processing', 'completed', 'failed'))`
    );

    // Create indexes
    await queryRunner.createIndex(
      'video_jobs',
      new TableIndex({
        name: 'idx_jobs_user_id',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'video_jobs',
      new TableIndex({
        name: 'idx_jobs_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'video_jobs',
      new TableIndex({
        name: 'idx_jobs_created_at',
        columnNames: ['createdAt'],
      })
    );

    await queryRunner.createIndex(
      'video_jobs',
      new TableIndex({
        name: 'idx_jobs_user_status',
        columnNames: ['userId', 'status'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'video_jobs',
      new TableForeignKey({
        name: 'fk_video_jobs_user',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['userId'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('video_jobs', 'fk_video_jobs_user');
    await queryRunner.dropIndex('video_jobs', 'idx_jobs_user_status');
    await queryRunner.dropIndex('video_jobs', 'idx_jobs_created_at');
    await queryRunner.dropIndex('video_jobs', 'idx_jobs_status');
    await queryRunner.dropIndex('video_jobs', 'idx_jobs_user_id');
    await queryRunner.query('ALTER TABLE video_jobs DROP CONSTRAINT chk_video_jobs_status');
    await queryRunner.dropTable('video_jobs');
  }
}
