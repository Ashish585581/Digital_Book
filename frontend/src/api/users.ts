import { apiClient } from './client';
import { User, UserCreate, UserUpdate, PaginatedUsers } from '@/types/user';

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'admin' | 'student';
}

export const usersApi = {
  async listUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.role) params.append('role', filters.role);

    const response = await apiClient.get<PaginatedUsers>(`/users?${params.toString()}`);
    return response.data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  async updateUser(userId: number, data: UserUpdate): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  },
};