import fc from 'fast-check';
import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { VideoJob, JobStatus } from '../entities/VideoJob.entity';
import { CreateUsersTable1700000001000 } from './1700000001000-CreateUsersTable';
import { CreateVideoJobsTable1700000002000 } from './1700000002000-CreateVideoJobsTable';

/**
 * Property-Based Tests for Database Constraints
 * Feature: frameforge-video-processing-system
 * 
 * These tests validate that database constraints are properly enforced
 * according to Requirements 7.2 and 7.3.
 */

describe('Database Constraints Property Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Use PostgreSQL test database
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'frameforge',
      password: process.env.DB_PASSWORD || 'frameforge',
      database: process.env.DB_NAME || 'frameforge',
      entities: [User, VideoJob],
      synchronize: false,
      logging: false,
      connectTimeoutMS: 5000,
    });

    try {
      await dataSource.initialize();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }

    // Drop existing tables if they exist and run migrations
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      // Drop tables in reverse order (respecting foreign keys)
      await queryRunner.query('DROP TABLE IF EXISTS video_jobs CASCADE');
      await queryRunner.query('DROP TABLE IF EXISTS users CASCADE');
      
      // Run migrations
      await new CreateUsersTable1700000001000().up(queryRunner);
      await new CreateVideoJobsTable1700000002000().up(queryRunner);
    } catch (error) {
      console.error('Failed to set up database schema:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }, 30000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      try {
        await dataSource.destroy();
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }, 10000);

  beforeEach(async () => {
    // Clean up data before each test using query builder
    await dataSource.getRepository(VideoJob).createQueryBuilder().delete().execute();
    await dataSource.getRepository(User).createQueryBuilder().delete().execute();
  });

  /**
   * **Validates: Requirements 7.2**
   * 
   * Property 33: Job creation is atomic
   * 
   * For any Video_Job creation, either all related data (job record, initial status, 
   * timestamps) is persisted successfully, or none of it is (transaction rollback).
   */
  describe('Property 33: Job creation is atomic', () => {
    it('should persist all job data atomically or rollback completely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]+\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
            status: fc.constantFrom(
              JobStatus.PENDING,
              JobStatus.PROCESSING,
              JobStatus.COMPLETED,
              JobStatus.FAILED
            ),
          }),
          async (jobData) => {
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
              // Create user first
              const user = queryRunner.manager.create(User, {
                username: jobData.username,
                email: jobData.email,
                passwordHash: 'test-hash',
              });
              const savedUser = await queryRunner.manager.save(user);

              // Create job within transaction
              const job = queryRunner.manager.create(VideoJob, {
                userId: savedUser.userId,
                filename: jobData.filename,
                status: jobData.status,
                videoUrl: jobData.videoUrl,
              });
              const savedJob = await queryRunner.manager.save(job);

              // Commit transaction
              await queryRunner.commitTransaction();

              // Verify all data was persisted
              const foundJob = await dataSource.getRepository(VideoJob).findOne({
                where: { jobId: savedJob.jobId },
              });

              // All fields should be present
              expect(foundJob).toBeDefined();
              expect(foundJob!.jobId).toBe(savedJob.jobId);
              expect(foundJob!.userId).toBe(savedUser.userId);
              expect(foundJob!.filename).toBe(jobData.filename);
              expect(foundJob!.status).toBe(jobData.status);
              expect(foundJob!.videoUrl).toBe(jobData.videoUrl);
              expect(foundJob!.createdAt).toBeInstanceOf(Date);
            } catch (error) {
              // Rollback on error
              await queryRunner.rollbackTransaction();

              // Verify nothing was persisted
              const jobs = await dataSource.getRepository(VideoJob).find();
              expect(jobs.length).toBe(0);
            } finally {
              await queryRunner.release();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should rollback job creation if transaction fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]+\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
          }),
          async (jobData) => {
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
              // Create user
              const user = queryRunner.manager.create(User, {
                username: jobData.username,
                email: jobData.email,
                passwordHash: 'test-hash',
              });
              const savedUser = await queryRunner.manager.save(user);

              // Create job
              const job = queryRunner.manager.create(VideoJob, {
                userId: savedUser.userId,
                filename: jobData.filename,
                status: JobStatus.PENDING,
                videoUrl: jobData.videoUrl,
              });
              await queryRunner.manager.save(job);

              // Simulate an error before commit
              throw new Error('Simulated transaction failure');
            } catch (error) {
              await queryRunner.rollbackTransaction();
            } finally {
              await queryRunner.release();
            }

            // Verify nothing was persisted after rollback
            const jobs = await dataSource.getRepository(VideoJob).find();
            const users = await dataSource.getRepository(User).find({
              where: { username: jobData.username },
            });

            expect(jobs.length).toBe(0);
            expect(users.length).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * **Validates: Requirements 7.3**
   * 
   * Property 34: Foreign key constraints are enforced
   * 
   * For any Video_Job record, it must reference a valid user_id that exists 
   * in the users table.
   */
  describe('Property 34: Foreign key constraints are enforced', () => {
    it('should reject job creation with non-existent userId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]+\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
            status: fc.constantFrom(
              JobStatus.PENDING,
              JobStatus.PROCESSING,
              JobStatus.COMPLETED,
              JobStatus.FAILED
            ),
          }),
          async (jobData) => {
            // Verify the userId doesn't exist
            const existingUser = await dataSource.getRepository(User).findOne({
              where: { userId: jobData.userId },
            });
            expect(existingUser).toBeNull();

            // Attempt to create job with non-existent userId
            const job = dataSource.getRepository(VideoJob).create({
              userId: jobData.userId,
              filename: jobData.filename,
              status: jobData.status,
              videoUrl: jobData.videoUrl,
            });

            // Should throw foreign key constraint violation
            await expect(dataSource.getRepository(VideoJob).save(job)).rejects.toThrow();

            // Verify job was not created
            const jobs = await dataSource.getRepository(VideoJob).find({
              where: { userId: jobData.userId },
            });
            expect(jobs.length).toBe(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow job creation only with valid userId', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.stringMatching(/^[a-zA-Z0-9_]{3,50}$/),
            email: fc.emailAddress(),
            filename: fc.stringMatching(/^[a-zA-Z0-9_-]+\.(mp4|avi|mov|mkv|webm)$/),
            videoUrl: fc.webUrl(),
            status: fc.constantFrom(
              JobStatus.PENDING,
              JobStatus.PROCESSING,
              JobStatus.COMPLETED,
              JobStatus.FAILED
            ),
          }),
          async (jobData) => {
            // Create a valid user first
            const user = dataSource.getRepository(User).create({
              username: jobData.username,
              email: jobData.email,
              passwordHash: 'test-hash',
            });
            const savedUser = await dataSource.getRepository(User).save(user);

            // Create job with valid userId
            const job = dataSource.getRepository(VideoJob).create({
              userId: savedUser.userId,
              filename: jobData.filename,
              status: jobData.status,
              videoUrl: jobData.videoUrl,
            });

            // Should succeed
            const savedJob = await dataSource.getRepository(VideoJob).save(job);

            // Verify job was created with correct foreign key
            expect(savedJob.userId).toBe(savedUser.userId);

            // Verify we can query the job through the relationship
            const foundJob = await dataSource.getRepository(VideoJob).findOne({
              where: { jobId: savedJob.jobId },
              relations: ['user'],
            });

            expect(foundJob).toBeDefined();
            expect(foundJob!.user.userId).toBe(savedUser.userId);
            expect(foundJob!.user.username).toBe(jobData.username);
          }
        ),
        { numRuns: 10 }
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
          async (testData) => {
            // Create a user
            const user = dataSource.getRepository(User).create({
              username: testData.username,
              email: testData.email,
              passwordHash: 'test-hash',
            });
            const savedUser = await dataSource.getRepository(User).save(user);

            // Create multiple jobs for this user
            const jobs = [];
            for (let i = 0; i < testData.jobCount; i++) {
              const job = dataSource.getRepository(VideoJob).create({
                userId: savedUser.userId,
                filename: `video_${i}.mp4`,
                status: JobStatus.PENDING,
                videoUrl: `https://example.com/video_${i}.mp4`,
              });
              jobs.push(await dataSource.getRepository(VideoJob).save(job));
            }

            // Verify jobs were created
            const createdJobs = await dataSource.getRepository(VideoJob).find({
              where: { userId: savedUser.userId },
            });
            expect(createdJobs.length).toBe(testData.jobCount);

            // Delete the user
            await dataSource.getRepository(User).delete({ userId: savedUser.userId });

            // Verify all jobs were cascade deleted
            const remainingJobs = await dataSource.getRepository(VideoJob).find({
              where: { userId: savedUser.userId },
            });
            expect(remainingJobs.length).toBe(0);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
