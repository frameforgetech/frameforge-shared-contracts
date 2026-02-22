export { CreateUsersTable1700000001000 } from './1700000001000-CreateUsersTable';
export { CreateVideoJobsTable1700000002000 } from './1700000002000-CreateVideoJobsTable';
export { CreateNotificationLogTable1700000003000 } from './1700000003000-CreateNotificationLogTable';

import { CreateUsersTable1700000001000 } from './1700000001000-CreateUsersTable';
import { CreateVideoJobsTable1700000002000 } from './1700000002000-CreateVideoJobsTable';
import { CreateNotificationLogTable1700000003000 } from './1700000003000-CreateNotificationLogTable';

// Export migrations array for TypeORM
export const migrations = [
  CreateUsersTable1700000001000,
  CreateVideoJobsTable1700000002000,
  CreateNotificationLogTable1700000003000,
];
