import { apiClient } from './client';
import { ReadingProgress, ProgressUpdate, ProgressList } from '@/types/progress';

export const progressApi = {
  async getAllProgress(): Promise<ProgressList> {
    const response = await apiClient.get<ProgressList>('/progress');
    return response.data;
  },

  async getProgress(bookId: number): Promise<ReadingProgress> {
    const response = await apiClient.get<ReadingProgress>(`/progress/${bookId}`);
    return response.data;
  },

  async updateProgress(bookId: number, data: ProgressUpdate): Promise<ReadingProgress> {
    const response = await apiClient.put<ReadingProgress>(`/progress/${bookId}`, data);
    return response.data;
  },
};