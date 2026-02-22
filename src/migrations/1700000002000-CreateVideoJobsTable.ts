import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateVideoJobsTable1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'video_jobs',
        columns: [
          {
            name: 'job_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
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
            name: 'video_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'result_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'frame_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
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
        columnNames: ['user_id'],
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
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'video_jobs',
      new TableIndex({
        name: 'idx_jobs_user_status',
        columnNames: ['user_id', 'status'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'video_jobs',
      new TableForeignKey({
        name: 'fk_video_jobs_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['user_id'],
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
