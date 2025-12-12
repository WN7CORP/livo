export interface BookData {
  title: string;
  pageCount: string; // Estimated or extracted
  chapters: string; // Comma separated or list
  content: string; // Full formatted content
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface ExtractionJob {
  id: string;
  name: string; // File name
  file?: File; 
  status: JobStatus;
  bookData?: BookData;
  logs: string[];
  progress: number; // 0 to 100
  error?: string;
  createdAt: number;
}