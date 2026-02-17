import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateNotificationLogTable1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_log',
        columns: [
          {
            name: 'notificationId',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'jobId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'notificationType',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'recipientEmail',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'deliveryStatus',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'retryCount',
            type: 'integer',
            default: 0,
            isNullable: false,
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
            name: 'sentAt',
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
       CHECK (notificationType IN ('success', 'failure'))`
    );

    await queryRunner.query(
      `ALTER TABLE notification_log ADD CONSTRAINT chk_notification_log_status 
       CHECK (deliveryStatus IN ('pending', 'sent', 'failed'))`
    );

    // Create indexes
    await queryRunner.createIndex(
      'notification_log',
      new TableIndex({
        name: 'idx_notifications_job_id',
        columnNames: ['jobId'],
      })
    );

    await queryRunner.createIndex(
      'notification_log',
      new TableIndex({
        name: 'idx_notifications_status',
        columnNames: ['deliveryStatus'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'notification_log',
      new TableForeignKey({
        name: 'fk_notification_log_job',
        columnNames: ['jobId'],
        referencedTableName: 'video_jobs',
        referencedColumnNames: ['jobId'],
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
