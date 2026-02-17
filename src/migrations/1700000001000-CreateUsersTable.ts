import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_username',
        columnNames: ['username'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['email'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'idx_users_email');
    await queryRunner.dropIndex('users', 'idx_users_username');
    await queryRunner.dropTable('users');
  }
}
