# FrameForge Shared Contracts

Shared TypeScript contracts, entities, and database migrations for FrameForge microservices.

## 📦 Installation

```bash
npm install @frameforge/shared-contracts
```

## 🚀 Usage

```typescript
import { User, VideoJob, NotificationLog, JobStatus, NotificationType } from '@frameforge/shared-contracts';

// Use the entities and types in your service
const job: VideoJob = {
  jobId: '...',
  userId: '...',
  filename: 'video.mp4',
  status: JobStatus.PENDING,
  videoUrl: 'https://...',
  // ...
};
```

## 📚 Exported Types

### Entities
- `User` - User entity with authentication fields
- `VideoJob` - Video processing job entity
- `NotificationLog` - Notification tracking entity

### Enums
- `JobStatus` - Job status types: PENDING, PROCESSING, COMPLETED, FAILED
- `NotificationType` - Notification types: EMAIL, SMS, PUSH
- `DeliveryStatus` - Delivery status: SENT, DELIVERED, FAILED, PENDING

### Migrations
- Database migration files for TypeORM

## 🛠️ Development

```bash
# Build
npm run build

# The package is ready for publishing after build
```

## 📄 License

MIT

---

**Part of the FrameForge microservices ecosystem**
