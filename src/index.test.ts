import * as types from './index';
import { JobStatus } from './entities/VideoJob.entity';

describe('Shared Types', () => {
  it('should export JobStatus enum with all values', () => {
    expect(types.JobStatus.PENDING).toBe('pending');
    expect(types.JobStatus.PROCESSING).toBe('processing');
    expect(types.JobStatus.COMPLETED).toBe('completed');
    expect(types.JobStatus.FAILED).toBe('failed');
  });

  it('should export User entity', () => {
    const user: types.User = {
      userId: '123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(user.userId).toBe('123');
  });

  it('should export VideoJob entity with correct status', () => {
    const job: types.VideoJob = {
      jobId: 'job-123',
      userId: 'user-123',
      filename: 'video.mp4',
      status: JobStatus.PENDING,
      videoUrl: 'https://s3.amazonaws.com/video.mp4',
      createdAt: new Date(),
    } as any;
    expect(job.status).toBe('pending');
  });
});
