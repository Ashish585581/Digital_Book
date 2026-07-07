import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AxiosError } from 'axios';
import { User } from '@/types/auth';
import { authApi } from '@/api/auth';

// Pydantic v2 validation error format
type PydanticValidationError = {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
};

// Custom BookLore error format
type BookLoreError = {
  detail: {
    error: {
      code: string;
      message: string;
    };
  };
};

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError;
  if (!axiosErr.response?.data) {
    return axiosErr.message || fallback;
  }
  const data = axiosErr.response.data as Record<string, unknown>;

  // Try BookLore custom error format: detail.error.message
  const bookloreData = data as BookLoreError;
  if (bookloreData.detail?.error?.message) {
    return bookloreData.detail.error.message;
  }

  // Try Pydantic validation error format: detail[].msg
  const pydanticData = data as PydanticValidationError;
  if (Array.isArray(pydanticData.detail) && pydanticData.detail.length > 0) {
    return pydanticData.detail[0].msg;
  }

  return axiosErr.message || fallback;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string, expectedRole?: 'student' | 'admin') => Promise<void>;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string, expectedRole?: 'student' | 'admin') => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ username, password, expected_role: expectedRole });
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          // Fetch user profile
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ error: extractErrorMessage(err, 'Login failed'), isLoading: false });
          throw err;
        }
      },

      register: async (username: string, email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register({ username, email, password, name });
          // After registration, login automatically as student
          await get().login(username, password, 'student');
        } catch (err) {
          set({ error: extractErrorMessage(err, 'Registration failed'), isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            await authApi.logout({ refresh_token: refreshToken });
          } catch {
            // Ignore logout errors
          }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);