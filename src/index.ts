// Export TypeORM entities
export * from './entities';

// Export TypeORM migrations
export * from './migrations';

// User Types (API contracts)

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

export interface ValidateRequest {
  token: string;
}

export interface ValidateResponse {
  valid: boolean;
  userId?: string;
  username?: string;
}

// Video Job Types (API contracts)

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  videoId: string;
  expiresIn: number;
}

export interface CreateJobRequest {
  videoId: string;
  filename: string;
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

export interface JobSummary {
  jobId: string;
  filename: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export interface ListJobsResponse {
  jobs: JobSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobDetailResponse {
  jobId: string;
  userId: string;
  filename: string;
  status: string;
  videoUrl: string;
  resultUrl?: string;
  frameCount?: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Message Queue Types
export interface VideoProcessingMessage {
  jobId: string;
  userId: string;
  videoUrl: string;
  filename: string;
  timestamp: string;
}

export interface VideoEventMessage {
  jobId: string;
  userId: string;
  eventType: 'completed' | 'failed';
  filename: string;
  resultUrl?: string;
  frameCount?: number;
  errorMessage?: string;
  timestamp: string;
}

// Processing Types
export interface ProcessingContext {
  jobId: string;
  userId: string;
  videoUrl: string;
  filename: string;
  workDir: string;
}

export interface ProcessingResult {
  success: boolean;
  frameCount?: number;
  zipPath?: string;
  zipUrl?: string;
  errorMessage?: string;
}

export interface FrameManifest {
  videoFilename: string;
  totalFrames: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  frames: FrameInfo[];
  processedAt: string;
}

export interface FrameInfo {
  filename: string;
  timestamp: number;
  size: number;
}

// Notification Types (API contracts)
export interface NotificationMessage {
  jobId: string;
  userId: string;
  recipientEmail: string;
  notificationType: 'success' | 'failure';
  filename: string;
  resultUrl?: string;
  errorMessage?: string;
  timestamp: string;
}

// Cache Types
export interface CachedJob {
  jobId: string;
  status: string;
  filename: string;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export interface CachedUser {
  userId: string;
  username: string;
  email: string;
}

// Error Types
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}
