export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  expected_role?: 'student' | 'admin';
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}