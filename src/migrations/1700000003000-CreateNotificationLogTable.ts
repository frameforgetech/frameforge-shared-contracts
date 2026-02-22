import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationLogTable1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_log',
        columns: [
          {
            name: 'notification_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'job_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'notification_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'recipient_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'delivery_status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
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
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add CHECK constraints
    await queryRunner.query(
      `ALTER TABLE notification_log ADD CONSTRAINT chk_notification_log_type 
       CHECK (notification_type IN ('success', 'failure'))`
    );

    await queryRunner.query(
      `ALTER TABLE notification_log ADD CONSTRAINT chk_notification_log_status 
       CHECK (delivery_status IN ('pending', 'sent', 'failed'))`
    );

    // Create indexes
    await queryRunner.createIndex(
      'notification_log',
      new TableIndex({
        name: 'idx_notifications_job_id',
        columnNames: ['job_id'],
      })
    );

    await queryRunner.createIndex(
      'notification_log',
      new TableIndex({
        name: 'idx_notifications_status',
        columnNames: ['delivery_status'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'notification_log',
      new TableForeignKey({
        name: 'fk_notification_log_job',
        columnNames: ['job_id'],
        referencedTableName: 'video_jobs',
        referencedColumnNames: ['job_id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('notification_log', 'fk_notification_log_job');
    await queryRunner.dropIndex('notification_log', 'idx_notifications_status');
    await queryRunner.dropIndex('notification_log', 'idx_notifications_job_id');
    await queryRunner.query('ALTER TABLE notification_log DROP CONSTRAINT chk_notification_log_status');
    await queryRunner.query('ALTER TABLE notification_log DROP CONSTRAINT chk_notification_log_type');
    await queryRunner.dropTable('notification_log');
  }
}
