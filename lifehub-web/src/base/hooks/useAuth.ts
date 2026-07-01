import { useEffect } from 'react'
import { useAuthStore } from '@/base/stores/authStore'
import { getMe } from '@/base/api/auth'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !user) {
      setLoading(true)
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false))
    }
  }, [isAuthenticated])

  return { user, isAuthenticated, isLoading, logout }
}
