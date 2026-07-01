import apiClient from './client'
import type { ApiResponse } from './types'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id: string
  username: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function login(data: LoginRequest): Promise<ApiResponse<TokenResponse>> {
  const response = await apiClient.post('/auth/login', data)
  return response.data
}

export async function register(data: RegisterRequest): Promise<ApiResponse<UserResponse>> {
  const response = await apiClient.post('/auth/register', data)
  return response.data
}

export async function refreshToken(refresh_token: string): Promise<ApiResponse<TokenResponse>> {
  const response = await apiClient.post('/auth/refresh', { refresh_token })
  return response.data
}

export async function getMe(): Promise<ApiResponse<UserResponse>> {
  const response = await apiClient.get('/auth/me')
  return response.data
}
