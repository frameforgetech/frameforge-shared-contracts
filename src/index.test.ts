import * as types from './index';

describe('Shared Types', () => {
  it('should export JobStatus type', () => {
    const status: types.JobStatus = 'pending';
    expect(['pending', 'processing', 'completed', 'failed']).toContain(status);
  });

  it('should export User interface', () => {
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

  it('should export VideoJob interface', () => {
    const job: types.VideoJob = {
      jobId: 'job-123',
      userId: 'user-123',
      filename: 'video.mp4',
      status: 'pending',
      videoUrl: 'https://s3.amazonaws.com/video.mp4',
      createdAt: new Date(),
    };
    expect(job.status).toBe('pending');
  });
});
