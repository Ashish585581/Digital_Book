import { User as AuthUser } from './auth';

export type User = AuthUser;

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'student';
}

export interface UserUpdate {
  name?: string;
  role?: 'admin' | 'student';
  is_active?: boolean;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pages: number;
}