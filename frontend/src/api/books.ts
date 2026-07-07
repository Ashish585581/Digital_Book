import { apiClient } from './client';
import {
  Book,
  BookDetail,
  BookMetadataCreate,
  BookMetadataUpdate,
  PaginatedBooks,
} from '@/types/book';

export interface BookFilters {
  page?: number;
  limit?: number;
  class_grade?: string;
  book_type?: 'PDF' | 'EPUB';
  search?: string;
  library_type?: 'school' | 'public';
}

export const booksApi = {
  async listBooks(filters: BookFilters = {}): Promise<PaginatedBooks> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.class_grade) params.append('class_grade', filters.class_grade);
    if (filters.book_type) params.append('book_type', filters.book_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.library_type) params.append('library_type', filters.library_type);

    const response = await apiClient.get<PaginatedBooks>(`/books?${params.toString()}`);
    return response.data;
  },

  async getBook(bookId: number): Promise<BookDetail> {
    const response = await apiClient.get<BookDetail>(`/books/${bookId}`);
    return response.data;
  },

  async uploadBook(
    file: File,
    metadata: BookMetadataCreate,
    onProgress?: (progress: number) => void
  ): Promise<Book> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('authors', metadata.authors);
    formData.append('class_grade', metadata.class_grade);
    if (metadata.library_type) {
      formData.append('library_type', metadata.library_type);
    }

    const response = await apiClient.post<Book>('/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  async updateBook(bookId: number, metadata: BookMetadataUpdate): Promise<BookDetail> {
    const response = await apiClient.put<BookDetail>(`/books/${bookId}`, metadata);
    return response.data;
  },

  async deleteBook(bookId: number): Promise<void> {
    await apiClient.delete(`/books/${bookId}`);
  },

  getStreamUrl(bookId: number): string {
    const token = localStorage.getItem('access_token');
    return `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/books/${bookId}/stream?token=${token}`;
  },

  async uploadCover(bookId: number, file: File): Promise<{ thumbnail: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/books/${bookId}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};