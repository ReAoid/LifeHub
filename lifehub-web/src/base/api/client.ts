import axios from 'axios'
import { isTokenExpired } from '@/base/lib/jwt'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle 401 and auto-refresh
let isRefreshing = false
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/** Redirect to login, clearing auth state */
function redirectToLogin() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only handle 401 from the backend, not network errors or other statuses
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')

    // If no refresh token, or refresh token is also expired, redirect immediately
    if (!refreshToken || isTokenExpired(refreshToken)) {
      isRefreshing = false
      redirectToLogin()
      return Promise.reject(error)
    }

    try {
      const response = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      })
      const { access_token, refresh_token: newRefreshToken } = response.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', newRefreshToken)

      // Retry all queued requests with the new token
      processQueue(null, access_token)

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return apiClient(originalRequest)
    } catch (refreshError: any) {
      // If the refresh itself failed (network error or expired refresh token)
      processQueue(refreshError, null)

      // Only redirect to login if the refresh returned a 401/403 (invalid/expired refresh token)
      // For network errors, just reject so the caller can handle it
      if (refreshError?.response?.status && [401, 403].includes(refreshError.response.status)) {
        redirectToLogin()
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
