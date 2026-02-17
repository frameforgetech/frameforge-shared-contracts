import fc from 'fast-check';
import { DataSource } from 'typeorm';
import { User } from './entities/User.entity';
import { VideoJob, JobStatus } from './entities/VideoJob.entity';

describe('Database Constraints Property Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Initialize PostgreSQL database for testing
    // Requires a running PostgreSQL instance (e.g., via docker-compose up -d postgres)
    // Or set TEST_DB_* environment variables to connect to a different database
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USER || 'frameforge',
      password: process.env.TEST_DB_PASSWORD || 'frameforge',
      database: process.env.TEST_DB_NAME || 'frameforge',
      entities: [User, VideoJob],
      synchronize: true, // Auto-create schema for tests
      dropSchema: true, // Clean slate for each test run
      logging: false,
      ssl: false, // Disable SSL for local development
      extra: {
        // Additional connection options
        max: 10,
        connectionTimeoutMillis: 5000,
      },
    });

    try {
      await dataSource.initialize();
    } catch (error) {
      console.error('Failed to connect to test database. Make sure PostgreSQL is running.');
      console.error('You can start it with: docker-compose up -d postgres');
      throw error;
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up all data before each test
    // Use query builder to delete all records
    await dataSource.getRepository(VideoJob).createQueryBuilder().delete().execute();
    await dataSource.getRepository(User).createQueryBuilder().delete().execute();
  });

  /**
   * Feature: frameforge-video-processing-system
   * Property 33: Job creation is atomic
   * **Validates: Requirements 7.2**
   */
  describe('Property 33: Job creation is atomic', () => {
    it('should ensure all job data is persisted or none at all', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,200}\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
          }),
          async ({ username, email, filename, videoUrl }) => {
            const userRepo = dataSource.getRepository(User);
            const jobRepo = dataSource.getRepository(VideoJob);

            // Make username and email unique by appending timestamp and random value
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const uniqueUsername = (username + uniqueSuffix).substring(0, 50);
            const uniqueEmail = email.replace('@', uniqueSuffix + '@');

            // Create a user first
            const user = userRepo.create({
              username: uniqueUsername,
              email: uniqueEmail,
              passwordHash: 'test_hash_' + Math.random(),
            });
            await userRepo.save(user);

            // Use transaction to create job atomically
            await dataSource.transaction(async (transactionalEntityManager) => {
              const job = transactionalEntityManager.getRepository(VideoJob).create({
                userId: user.userId,
                filename,
                status: JobStatus.PENDING,
                videoUrl,
              });

              await transactionalEntityManager.save(job);

              // Verify job was created within transaction
              const savedJob = await transactionalEntityManager
                .getRepository(VideoJob)
                .findOne({ where: { jobId: job.jobId } });

              expect(savedJob).toBeDefined();
              expect(savedJob?.userId).toBe(user.userId);
              expect(savedJob?.filename).toBe(filename);
              expect(savedJob?.status).toBe(JobStatus.PENDING);
              expect(savedJob?.videoUrl).toBe(videoUrl);
              expect(savedJob?.createdAt).toBeInstanceOf(Date);
            });

            // Verify job persisted after transaction
            const jobs = await jobRepo.find({ where: { userId: user.userId } });
            expect(jobs).toHaveLength(1);
            expect(jobs[0].filename).toBe(filename);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should rollback all changes if transaction fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,200}\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
          }),
          async ({ username, email, filename, videoUrl }) => {
            const userRepo = dataSource.getRepository(User);
            const jobRepo = dataSource.getRepository(VideoJob);

            // Make username and email unique
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const uniqueUsername = (username + uniqueSuffix).substring(0, 50);
            const uniqueEmail = email.replace('@', uniqueSuffix + '@');

            // Create a user first
            const user = userRepo.create({
              username: uniqueUsername,
              email: uniqueEmail,
              passwordHash: 'test_hash_' + Math.random(),
            });
            await userRepo.save(user);

            const initialJobCount = await jobRepo.count();

            // Attempt transaction that will fail
            try {
              await dataSource.transaction(async (transactionalEntityManager) => {
                const job = transactionalEntityManager.getRepository(VideoJob).create({
                  userId: user.userId,
                  filename,
                  status: JobStatus.PENDING,
                  videoUrl,
                });

                await transactionalEntityManager.save(job);

                // Force an error to trigger rollback
                throw new Error('Simulated transaction failure');
              });
            } catch (error) {
              // Expected to fail
            }

            // Verify no job was created (transaction rolled back)
            const finalJobCount = await jobRepo.count();
            expect(finalJobCount).toBe(initialJobCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: frameforge-video-processing-system
   * Property 34: Foreign key constraints are enforced
   * **Validates: Requirements 7.3**
   */
  describe('Property 34: Foreign key constraints are enforced', () => {
    it('should prevent creating jobs with non-existent user IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,200}\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
          }),
          async ({ userId, filename, videoUrl }) => {
            const jobRepo = dataSource.getRepository(VideoJob);

            // Attempt to create job with non-existent user ID
            const job = jobRepo.create({
              userId,
              filename,
              status: JobStatus.PENDING,
              videoUrl,
            });

            // Should throw foreign key constraint violation
            await expect(jobRepo.save(job)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow creating jobs with valid user IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]{1,200}\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
          }),
          async ({ username, email, filename, videoUrl }) => {
            const userRepo = dataSource.getRepository(User);
            const jobRepo = dataSource.getRepository(VideoJob);

            // Make username and email unique
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const uniqueUsername = (username + uniqueSuffix).substring(0, 50);
            const uniqueEmail = email.replace('@', uniqueSuffix + '@');

            // Create a valid user
            const user = userRepo.create({
              username: uniqueUsername,
              email: uniqueEmail,
              passwordHash: 'test_hash_' + Math.random(),
            });
            await userRepo.save(user);

            // Create job with valid user ID
            const job = jobRepo.create({
              userId: user.userId,
              filename,
              status: JobStatus.PENDING,
              videoUrl,
            });

            const savedJob = await jobRepo.save(job);

            expect(savedJob.jobId).toBeDefined();
            expect(savedJob.userId).toBe(user.userId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cascade delete jobs when user is deleted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            jobCount: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ username, email, jobCount }) => {
            const userRepo = dataSource.getRepository(User);
            const jobRepo = dataSource.getRepository(VideoJob);

            // Make username and email unique
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const uniqueUsername = (username + uniqueSuffix).substring(0, 50);
            const uniqueEmail = email.replace('@', uniqueSuffix + '@');

            // Create a user
            const user = userRepo.create({
              username: uniqueUsername,
              email: uniqueEmail,
              passwordHash: 'test_hash_' + Math.random(),
            });
            await userRepo.save(user);

            // Create multiple jobs for this user
            const jobs = [];
            for (let i = 0; i < jobCount; i++) {
              const job = jobRepo.create({
                userId: user.userId,
                filename: `video_${i}.mp4`,
                status: JobStatus.PENDING,
                videoUrl: `https://example.com/video_${i}.mp4`,
              });
              jobs.push(await jobRepo.save(job));
            }

            // Verify jobs were created
            const jobsBeforeDelete = await jobRepo.find({ where: { userId: user.userId } });
            expect(jobsBeforeDelete).toHaveLength(jobCount);

            // Delete the user
            await userRepo.remove(user);

            // Verify all jobs were cascade deleted
            const jobsAfterDelete = await jobRepo.find({ where: { userId: user.userId } });
            expect(jobsAfterDelete).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
