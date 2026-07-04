import { create } from 'zustand'
import type { UserResponse } from '@/base/api/auth'
import { isTokenExpired } from '@/base/lib/jwt'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserResponse | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

/** Check stored tokens and clear them if expired */
function checkAndClearTokens(): boolean {
  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) return false
  if (isTokenExpired(accessToken)) {
    // Try refreshing before giving up – only clear if refresh token also expired
    const refreshToken = localStorage.getItem('refresh_token')
    if (isTokenExpired(refreshToken)) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return false
    }
    // Access token expired but refresh token still valid → keep tokens for interceptor to refresh
    return true
  }
  return true
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: checkAndClearTokens(),
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },
  hasPermission: () => true, // Simplified for now
}))
