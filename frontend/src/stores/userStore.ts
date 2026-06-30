import { create } from 'zustand';
import { User } from '@/types/auth';
import { UserCreate, UserUpdate } from '@/types/user';
import { usersApi } from '@/api/users';

interface UserState {
  users: User[];
  currentUser: User | null;
  total: number;
  page: number;
  pages: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    page?: number;
    limit?: number;
    role?: 'admin' | 'student';
  };

  // Actions
  fetchUsers: (filters?: { page?: number; limit?: number; role?: 'admin' | 'student' }) => Promise<void>;
  fetchUser: (userId: number) => Promise<void>;
  createUser: (data: UserCreate) => Promise<User>;
  updateUser: (userId: number, data: UserUpdate) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  setFilters: (filters: { role?: 'admin' | 'student' }) => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  error: null,
  filters: {},

  fetchUsers: async (filters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null, filters: currentFilters });

    try {
      const result = await usersApi.listUsers(currentFilters);
      set({
        users: result.items,
        total: result.total,
        page: result.page,
        pages: result.pages,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchUser: async (userId: number) => {
    set({ isLoading: true, error: null });
    try {
      const user = await usersApi.getUser(userId);
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createUser: async (data: UserCreate) => {
    set({ isLoading: true, error: null });
    try {
      const user = await usersApi.createUser(data);
      await get().fetchUsers();
      set({ isLoading: false });
      return user;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (userId: number, data: UserUpdate) => {
    set({ isLoading: true, error: null });
    try {
      await usersApi.updateUser(userId, data);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteUser: async (userId: number) => {
    set({ isLoading: true, error: null });
    try {
      await usersApi.deleteUser(userId);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchUsers(filters);
  },

  clearError: () => set({ error: null }),
}));
