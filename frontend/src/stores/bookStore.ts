import { create } from 'zustand';
import { Book, BookDetail, PaginatedBooks } from '@/types/book';
import { booksApi, BookFilters } from '@/api/books';

interface BookState {
  books: Book[];
  currentBook: BookDetail | null;
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  error: string | null;
  filters: BookFilters;

  // Actions
  fetchBooks: (filters?: BookFilters) => Promise<void>;
  fetchBook: (bookId: number) => Promise<void>;
  uploadBook: (file: File, title: string, authors: string, classGrade: string) => Promise<Book>;
  updateBook: (bookId: number, title?: string, authors?: string, classGrade?: string) => Promise<void>;
  deleteBook: (bookId: number) => Promise<void>;
  setFilters: (filters: BookFilters) => void;
  clearError: () => void;
  reset: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  currentBook: null,
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,
  filters: {},

  fetchBooks: async (filters?: BookFilters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null, filters: currentFilters });

    try {
      const result = await booksApi.listBooks(currentFilters);
      set({
        books: result.items,
        total: result.total,
        page: result.page,
        pages: result.pages,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchBook: async (bookId: number) => {
    set({ isLoading: true, error: null });
    try {
      const book = await booksApi.getBook(bookId);
      set({ currentBook: book, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  uploadBook: async (file: File, title: string, authors: string, classGrade: string) => {
    set({ isLoading: true, error: null });
    try {
      const book = await booksApi.uploadBook(file, { title, authors, class_grade: classGrade });
      // Refresh book list
      await get().fetchBooks();
      set({ isLoading: false });
      return book;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateBook: async (bookId: number, title?: string, authors?: string, classGrade?: string) => {
    set({ isLoading: true, error: null });
    try {
      await booksApi.updateBook(bookId, {
        ...(title && { title }),
        ...(authors && { authors }),
        ...(classGrade && { class_grade: classGrade }),
      });
      // Refresh book detail and list
      await get().fetchBook(bookId);
      await get().fetchBooks();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteBook: async (bookId: number) => {
    set({ isLoading: true, error: null });
    try {
      await booksApi.deleteBook(bookId);
      // Refresh book list
      await get().fetchBooks();
      set({ currentBook: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setFilters: (filters: BookFilters) => {
    set({ filters });
    get().fetchBooks(filters);
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      books: [],
      currentBook: null,
      total: 0,
      page: 1,
      pages: 1,
      isLoading: false,
      error: null,
      filters: {},
    });
  },
}));