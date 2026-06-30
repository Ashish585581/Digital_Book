import { apiClient } from './client';
import {
  User,
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
} from '@/types/auth';

export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  async refreshToken(request: RefreshTokenRequest): Promise<{ access_token: string; expires_in: number }> {
    const response = await apiClient.post('/auth/refresh', request);
    return response.data;
  },

  async logout(request: LogoutRequest): Promise<void> {
    await apiClient.post('/auth/logout', request);
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};