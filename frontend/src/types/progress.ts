export interface ReadingProgress {
  book_id: number;
  progress_percent: number;
  last_position: string | null;
  last_read_at: string | null;
}

export interface ProgressUpdate {
  progress_percent: number;
  last_position?: string;
}

export interface ProgressList {
  items: ReadingProgress[];
}